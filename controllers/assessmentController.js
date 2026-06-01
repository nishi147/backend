const AssessmentSubmission = require('../models/AssessmentSubmission');
const Lead = require('../models/Lead');
const sendEmail = require('../utils/sendEmail');

// @desc    Submit new assessment
// @route   POST /api/assessment-submissions
// @access  Public
exports.submitAssessment = async (req, res) => {
    try {
        const {
            parentName,
            mobile,
            email,
            studentName,
            age,
            class: studentClass,
            city,
            answers,
            score,
            category,
            recommendedProgram
        } = req.body;

        // 1. Validation
        if (!parentName || !mobile || !studentName || !age || !studentClass || !city || score === undefined || !category || !recommendedProgram) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields including student name, age, class, score, category, and recommended program.' 
            });
        }

        // 2. Save submission in AssessmentSubmissions
        const submission = await AssessmentSubmission.create({
            parentName,
            mobile,
            email,
            studentName,
            age: Number(age),
            class: studentClass,
            city,
            answers,
            score: Number(score),
            category,
            recommendedProgram
        });

        // 3. Upsert into existing Leads collection so it shows in the CRM/Sales Dashboard
        const leadNote = `[AI Readiness Assessment Completed]
Student: ${studentName} (Age: ${age}, Grade: ${studentClass})
City: ${city}
Score: ${score}/100
Category: ${category}
Recommended Program: ${recommendedProgram}
Submitted At: ${new Date().toLocaleString()}`;

        let existingLead = await Lead.findOne({ $or: [{ phone: mobile }, ...(email ? [{ email }] : [])] });

        if (existingLead) {
            // Update existing lead details and push notes
            existingLead.notes.push({ text: leadNote });
            existingLead.activityLog.push({
                action: 'Assessment Completed',
                note: `Completed AI Readiness Funnel: Score ${score}/100`
            });
            // Update fields if empty
            if (!existingLead.email && email) existingLead.email = email;
            if (score >= 75) existingLead.priority = 'High'; // High potential lead
            
            await existingLead.save();
        } else {
            // Create a brand new lead
            const newLeadData = {
                name: parentName,
                phone: mobile,
                email: email || undefined,
                source: 'Website',
                status: 'New',
                priority: score >= 75 ? 'High' : 'Medium',
                notes: [{ text: leadNote }],
                activityLog: [{
                    action: 'Lead Created',
                    note: 'Lead created via AI Readiness Assessment Funnel',
                    timestamp: new Date()
                }]
            };

            // Auto-assign to sales if any exist
            const User = require('../models/User');
            const salesUsers = await User.find({ role: 'sales' });
            if (salesUsers.length > 0) {
                const randomSales = salesUsers[Math.floor(Math.random() * salesUsers.length)];
                newLeadData.assignedTo = randomSales._id;
            }

            await Lead.create(newLeadData);
        }

        // 4. Fire Integration Hooks (CRM, Google Sheets, WhatsApp, Email)
        await triggerCRMHook(submission);
        await triggerGoogleSheetsHook(submission);
        await triggerWhatsAppHook(submission);
        await triggerEmailAutomation(submission);

        res.status(201).json({
            success: true,
            data: submission,
            message: 'Assessment submitted successfully and integrations triggered.'
        });
    } catch (err) {
        console.error('Submit Assessment Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get all assessment submissions
// @route   GET /api/assessment-submissions
// @access  Private (Admin, Sales)
exports.getAssessments = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const startIndex = (page - 1) * limit;

        const total = await AssessmentSubmission.countDocuments();
        const submissions = await AssessmentSubmission.find()
            .sort('-submittedAt')
            .skip(startIndex)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: submissions.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: submissions
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- INTEGRATION HOOKS IMPLEMENTATION ---

// CRM Hook: Mock sync with external CRM (Hubspot/Salesforce/etc.)
async function triggerCRMHook(submission) {
    try {
        console.log(`[CRM INTEGRATION] Syncing lead details for: ${submission.parentName} (${submission.mobile})`);
        // e.g. await axios.post(process.env.CRM_WEBHOOK_URL, { ...submission });
        return true;
    } catch (error) {
        console.error('[CRM INTEGRATION ERROR]:', error.message);
        return false;
    }
}

// Google Sheets Hook: Sync details to active sheets
async function triggerGoogleSheetsHook(submission) {
    try {
        console.log(`[GOOGLE SHEETS INTEGRATION] Appending row to Sheet for student: ${submission.studentName}`);
        // e.g. googleSheetsClient.spreadsheets.values.append({ ... });
        return true;
    } catch (error) {
        console.error('[GOOGLE SHEETS INTEGRATION ERROR]:', error.message);
        return false;
    }
}

// WhatsApp Hook: Auto trigger custom template messages
async function triggerWhatsAppHook(submission) {
    try {
        console.log(`[WHATSAPP AUTOMATION] Sending message to: ${submission.mobile} using template: 'ai_assessment_report'`);
        // e.g. await whatsappClient.sendTemplate({ to: submission.mobile, template: 'ai_assessment_report', body: [submission.parentName, submission.studentName, submission.score] });
        return true;
    } catch (error) {
        console.error('[WHATSAPP AUTOMATION ERROR]:', error.message);
        return false;
    }
}

// Email Automation Hook: Sends report directly to the parent
async function triggerEmailAutomation(submission) {
    if (!submission.email) {
        console.log('[EMAIL AUTOMATION] Skipped - parent email not provided.');
        return;
    }

    const emailSubject = `🚀 Is Your Child Ready for the AI Future? Assessment Report for ${submission.studentName}`;
    const strengthsList = getCategoryDetails(submission.category).strengths;
    const opportunitiesList = getCategoryDetails(submission.category).opportunities;

    const htmlBody = `
      <div style="font-family:'Nunito','Segoe UI',sans-serif;max-width:600px;margin:auto;background:#f8fafc;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#6b4fbb,#ef4444);padding:40px 30px;text-align:center;color:white;">
          <h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">AI Readiness Report 📊</h1>
          <p style="margin:8px 0 0;font-size:16px;opacity:0.9;">Discovering Your Child's Future Potential</p>
        </div>
        <div style="padding:32px 24px;background:white;">
          <p style="color:#1e293b;font-size:16px;margin:0 0 16px;">Dear <strong>${submission.parentName}</strong>,</p>
          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">Thank you for completing the AI Readiness Assessment for <strong>${submission.studentName}</strong> (Age: ${submission.age}, Class: ${submission.class}). Knowing where they stand in this changing tech landscape is the first step to setting them up for success.</p>
          
          <!-- Score Badge -->
          <div style="background:#f1f5f9;border-radius:16px;padding:24px;text-align:center;margin-bottom:32px;">
            <span style="font-size:12px;font-weight:800;color:#6b4fbb;text-transform:uppercase;letter-spacing:1.5px;display:block;margin-bottom:8px;">Readiness Score</span>
            <div style="font-size:48px;font-weight:900;color:#ef4444;line-height:1;margin-bottom:4px;">${submission.score}<span style="font-size:24px;color:#94a3b8;font-weight:700;">/100</span></div>
            <div style="display:inline-block;background:#e0e7ff;color:#4338ca;font-weight:800;font-size:13px;padding:6px 16px;border-radius:99px;margin-top:8px;">
              🏆 ${submission.category}
            </div>
          </div>

          <!-- Recommended Program -->
          <div style="border:2px dashed #6b4fbb;border-radius:16px;padding:20px;margin-bottom:32px;background:#faf5ff;">
            <h3 style="margin:0 0 8px;color:#6b4fbb;font-size:16px;font-weight:800;">💡 Recommended Future Skills Path:</h3>
            <p style="margin:0;font-size:18px;font-weight:900;color:#1e293b;">${submission.recommendedProgram}</p>
            <p style="margin:6px 0 0;font-size:13px;color:#64748b;">This program is tailor-made for students aged ${submission.age} to develop logical thinking, AI awareness, and hands-on coding skills.</p>
          </div>

          <!-- Strengths -->
          <div style="margin-bottom:24px;">
            <h4 style="margin:0 0 8px;color:#1e293b;font-size:15px;font-weight:800;border-left:4px solid #10b981;padding-left:8px;">Key Strengths</h4>
            <ul style="margin:0;padding-left:20px;font-size:14px;color:#475569;line-height:1.6;">
              ${strengthsList.map(s => `<li style="margin-bottom:4px;">${s}</li>`).join('')}
            </ul>
          </div>

          <!-- Growth Opportunities -->
          <div style="margin-bottom:32px;">
            <h4 style="margin:0 0 8px;color:#1e293b;font-size:15px;font-weight:800;border-left:4px solid #f59e0b;padding-left:8px;">Growth Areas</h4>
            <ul style="margin:0;padding-left:20px;font-size:14px;color:#475569;line-height:1.6;">
              ${opportunitiesList.map(o => `<li style="margin-bottom:4px;">${o}</li>`).join('')}
            </ul>
          </div>

          <hr style="border:0;border-top:1px solid #e2e8f0;margin:32px 0;">

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:32px;">
            <h3 style="color:#1e293b;font-size:18px;font-weight:800;margin-top:0;">Secure a ₹99 Live Trial Class Session!</h3>
            <p style="color:#64748b;font-size:13px;margin:8px 0 20px;">Let them interact 1-on-1 with our AI mentors, play tech quizzes, and build their first AI-assisted project.</p>
            <a href="${process.env.CLIENT_URL || 'https://ruzann.com'}/landingpage?claimOffer=true" style="display:inline-block;background:#ef4444;color:white;text-decoration:none;font-weight:800;padding:14px 28px;border-radius:12px;font-size:15px;box-shadow:0 4px 15px rgba(239,68,68,0.25);">🎯 Claim ₹99 Trial Session Now</a>
          </div>

          <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">Happy Learning!<br>© RUZANN EdTech</p>
        </div>
      </div>
    `;

    await sendEmail({
        email: submission.email,
        subject: emailSubject,
        message: `Hi ${submission.parentName},\n\nYour child ${submission.studentName}'s AI Readiness Score is ${submission.score}/100 (${submission.category}).\nWe recommend enrolling them in the ${submission.recommendedProgram}.\n\nVisit Ruzann to book their ₹99 trial class now!\nTeam Ruzann`,
        html: htmlBody
    });
}

function getCategoryDetails(category) {
    switch (category) {
        case 'Future Innovator':
            return {
                strengths: ['Highly curious about AI & future technologies', 'Excellent logical breakdown of problems', 'Active creator of games or digital scripts'],
                opportunities: ['Expose to advanced Python & Machine Learning models', 'Build real-world automation solutions', 'Participate in tech innovation hackathons']
            };
        case 'AI Explorer':
            return {
                strengths: ['Strong tech adaptation and curiosity', 'Good collaborative problem solving', 'Enjoys logical games and puzzles'],
                opportunities: ['Learn visual coding platforms like Scratch/Thunkable', 'Explore basics of prompt engineering', 'Design interactive AI chatbots']
            };
        case 'Creative Problem Solver':
            return {
                strengths: ['Creative storyteller with unique ideas', 'Persistent with puzzles and brain games', 'Good response to design modifications'],
                opportunities: ['Introduce block coding to structure ideas', 'Foster technological projects linking logic with design', 'Incorporate tech gamification to build logical logic confidence']
            };
        default: // Future Starter
            return {
                strengths: ['Observer and enthusiastic learner when guided', 'Excited to explore new apps and gadgets when introduced', 'Enjoys creative storytelling and basic problem decomposition'],
                opportunities: ['Build logical reasoning patterns via fun, gamified logic challenges', 'Develop confidence with digital creator tools rather than just screen viewing', 'Explore early coding through block-based visual storytelling games']
            };
    }
}

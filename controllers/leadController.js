const Lead = require('../models/Lead');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private (Admin, Sales)
exports.getLeads = async (req, res) => {
    try {
        let query;

        // If not admin, only show assigned leads
        if (req.user.role === 'sales') {
            query = Lead.find({ assignedTo: req.user._id });
        } else {
            // Admin can see all, or filter by specific assignee
            if (req.query.assignedTo === 'me') {
                query = Lead.find({ assignedTo: req.user._id });
            } else if (req.query.assignedTo) {
                query = Lead.find({ assignedTo: req.query.assignedTo });
            } else {
                query = Lead.find();
            }
        }

        // Search
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query = query.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex }
                ]
            });
        }

        // Filters
        if (req.query.status) query = query.find({ status: req.query.status });
        if (req.query.source) query = query.find({ source: req.query.source });
        
        // Follow-up Filter
        if (req.query.followUp === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            query = query.find({
                followUpDate: { $gte: today, $lt: tomorrow },
                status: { $ne: 'Converted' }
            });
        }

        // Sorting
        const sortBy = req.query.sort || '-createdAt';
        query = query.sort(sortBy);

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const startIndex = (page - 1) * limit;
        
        // Clone query to get total count before pagination
        const countQuery = Lead.find().merge(query);
        const total = await countQuery.countDocuments();

        query = query.skip(startIndex).limit(limit);

        const leads = await query.populate('assignedTo', 'name email');

        res.status(200).json({ 
            success: true, 
            count: leads.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: leads 
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
exports.getLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email');
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
        res.status(200).json({ success: true, data: lead });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create lead
// @route   POST /api/leads
// @access  Public
exports.createLead = async (req, res) => {
    try {
        const { email, phone } = req.body;
        
        // 1. Prevent Duplicates: Update if exists
        let lead;
        if (email || phone) {
            const query = [];
            if (email) query.push({ email });
            if (phone) query.push({ phone });
            
            lead = await Lead.findOne({ $or: query });
        }

        if (lead) {
            // Update existing lead with new info but keep assignedTo/status
            const updateParams = { $set: {}, $push: {} };
            
            for (const key of Object.keys(req.body)) {
                if (key === 'notes') {
                    // Push new notes if provided
                    if (Array.isArray(req.body.notes)) {
                         updateParams.$push.notes = { $each: req.body.notes };
                    }
                } else if (key !== 'assignedTo' && key !== 'status') {
                    updateParams.$set[key] = req.body[key];
                }
            }
            
            if (Object.keys(updateParams.$push).length === 0) delete updateParams.$push;
            if (Object.keys(updateParams.$set).length === 0) delete updateParams.$set;

            lead = await Lead.findByIdAndUpdate(lead._id, updateParams, { new: true });
        } else {
            // 2. Auto Assign Sales
            const User = require('../models/User');
            const salesUsers = await User.find({ role: 'sales' });
            
            if (salesUsers.length > 0) {
                // simple round robin or random assign
                const randomSales = salesUsers[Math.floor(Math.random() * salesUsers.length)];
                req.body.assignedTo = randomSales._id;
            }

            lead = await Lead.create({
                ...req.body,
                activityLog: [{
                    action: 'Lead Created',
                    note: `Lead created via ${req.body.source || 'Website'}`,
                    timestamp: new Date()
                }]
            });
        }

        // Handle Referral Logic properly based on the schema
        if (req.body.referralCode && lead) {
            const User = require('../models/User');
            const Referral = require('../models/Referral');
            
            // Find referrer user by code
            const referrerUser = await User.findOne({ referralCode: req.body.referralCode.toUpperCase() });
            
            if (referrerUser) {
                // Create a referral tracking doc for this lead (if not exists)
                const existingRef = await Referral.findOne({ referredLead: lead._id });
                if (!existingRef) {
                    await Referral.create({
                        referrer: referrerUser._id,
                        referredLead: lead._id,
                        status: 'Pending',
                        reward: 'Standard'
                    });
                }
            }
        }

        res.status(201).json({ success: true, data: lead });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res) => {
    try {
        let lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

        // If status changed to Converted, set convertedAt and default revenue
        if (req.body.status === 'Converted' && lead.status !== 'Converted') {
            req.body.convertedAt = Date.now();
            req.body.revenue = req.body.revenue || 0;
            
            // Mark associated referral as successful
            const Referral = require('../models/Referral');
            await Referral.findOneAndUpdate(
                { referredLead: lead._id },
                { status: 'Successful', reward: '₹500 Intro Bonus' }
            );

            console.log(`[Lead Update] Lead ${lead._id} changed to Converted. Revenue: ₹${req.body.revenue}`);
        } else if (req.body.status && req.body.status !== lead.status) {
            console.log(`[Lead Update] ${lead._id} status changed: ${lead.status} -> ${req.body.status}`);
        }

        // Detect changes for activity logging
        const activityEntries = [];
        
        if (req.body.status && req.body.status !== lead.status) {
            activityEntries.push({
                action: 'Status Changed',
                note: `Status updated from ${lead.status} to ${req.body.status}`,
                user: req.user._id
            });

            // If status changed to Converted, set convertedAt and default revenue
            if (req.body.status === 'Converted') {
                req.body.convertedAt = Date.now();
                req.body.revenue = req.body.revenue || 0;
                
                // Mark associated referral as successful
                const Referral = require('../models/Referral');
                await Referral.findOneAndUpdate(
                    { referredLead: lead._id },
                    { status: 'Successful', reward: '₹500 Intro Bonus' }
                );
                console.log(`[Lead Update] Lead ${lead._id} changed to Converted. Revenue: ₹${req.body.revenue}`);
            }
        }

        if (req.body.priority && req.body.priority !== lead.priority) {
            activityEntries.push({
                action: 'Priority Changed',
                note: `Priority updated from ${lead.priority} to ${req.body.priority}`,
                user: req.user._id
            });
        }

        if (req.body.assignedTo && req.body.assignedTo.toString() !== lead.assignedTo?.toString()) {
            const assignee = await User.findById(req.body.assignedTo);
            activityEntries.push({
                action: 'Lead Assigned',
                note: `Lead assigned to ${assignee ? assignee.name : 'Unknown User'}`,
                user: req.user._id
            });

            // Notify assignee
            if (assignee && assignee.email) {
                await sendEmail({
                    email: assignee.email,
                    subject: 'New Lead Assigned: ' + lead.name,
                    message: `Hi ${assignee.name},\n\nA new lead has been assigned to you.\n\nLead Name: ${lead.name}\nPhone: ${lead.phone}\n\nPlease check your dashboard for details.`
                });
            }
        }

        if (activityEntries.length > 0) {
            req.body.$push = { activityLog: { $each: activityEntries } };
        }

        lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: lead });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Assign lead specifically
// @route   PUT /api/leads/:id/assign
// @access  Private (Admin)
exports.assignLead = async (req, res) => {
    try {
        const { assignedTo } = req.body;
        if (!assignedTo) return res.status(400).json({ success: false, message: 'Assignee ID is required' });

        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

        const assignee = await User.findById(assignedTo);
        if (!assignee) return res.status(404).json({ success: false, message: 'Assignee not found' });

        lead.assignedTo = assignedTo;
        lead.activityLog.push({
            action: 'Lead Assigned',
            note: `Lead specifically assigned to ${assignee.name} by ${req.user.name}`,
            user: req.user._id
        });

        await lead.save();

        // Notify
        if (assignee.email) {
            await sendEmail({
                email: assignee.email,
                subject: 'New Lead Allocated: ' + lead.name,
                message: `Hi ${assignee.name},\n\nYou have been allocated a new lead: ${lead.name}.\n\nLead Phone: ${lead.phone}\n\nLogin to Ruzann Sales Dashboard to contact them.`
            });
        }

        res.status(200).json({ success: true, data: lead });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get Sales Performance for Admin
// @route   GET /api/leads/performance
// @access  Private (Admin)
exports.getSalesPerformance = async (req, res) => {
    try {
        const salesUsers = await User.find({ role: 'sales' }).select('name email');
        
        const performance = await Promise.all(salesUsers.map(async (user) => {
            const totalLeads = await Lead.countDocuments({ assignedTo: user._id });
            const convertedLeads = await Lead.countDocuments({ assignedTo: user._id, status: 'Converted' });
            
            const revenueRes = await Lead.aggregate([
                { $match: { assignedTo: user._id, status: 'Converted' } },
                { $group: { _id: null, total: { $sum: '$revenue' } } }
            ]);
            
            return {
                userId: user._id,
                name: user.name,
                email: user.email,
                totalLeads,
                convertedLeads,
                conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
                totalRevenue: revenueRes.length > 0 ? revenueRes[0].total : 0
            };
        }));

        res.status(200).json({ success: true, data: performance });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Add note to lead
// @route   POST /api/leads/:id/notes
// @access  Private
exports.addNote = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

        lead.notes.push({
            text: req.body.text,
            author: req.user._id
        });

        // Also add to activity log
        lead.activityLog.push({
            action: 'Note Added',
            note: req.body.text.substring(0, 50) + (req.body.text.length > 50 ? '...' : ''),
            user: req.user._id
        });

        await lead.save();
        res.status(200).json({ success: true, data: lead });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Export leads to CSV
// @route   GET /api/leads/export
// @access  Private (Admin)
exports.exportLeads = async (req, res) => {
    try {
        const leads = await Lead.find().populate('assignedTo', 'name email');
        
        let csv = 'Name,Email,Phone,Source,Status,AssignedTo,Revenue,CreatedAt\n';
        
        leads.forEach(lead => {
            csv += `${lead.name},${lead.email || ''},${lead.phone},${lead.source},${lead.status},${lead.assignedTo ? lead.assignedTo.name : 'Unassigned'},${lead.revenue},${lead.createdAt.toISOString()}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('leads-export.csv');
        res.status(200).send(csv);
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private (Admin)
exports.deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findByIdAndDelete(req.params.id);
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Share leads CSV via email to a sales person
// @route   POST /api/leads/share
// @access  Private (Admin)
exports.shareLeads = async (req, res) => {
    try {
        const { targetUserId, leadIds, customMessage } = req.body;
        
        if (!targetUserId) {
            return res.status(400).json({ success: false, message: 'Target Sales Person is required' });
        }

        const salesUser = await User.findById(targetUserId);
        if (!salesUser) {
            return res.status(404).json({ success: false, message: 'Sales Person not found' });
        }

        let query = {};
        if (leadIds && leadIds.length > 0) {
            query = { _id: { $in: leadIds } };
        } else {
            // Default to leads assigned to this person if no IDs provided
            query = { assignedTo: targetUserId };
        }

        const leads = await Lead.find(query).populate('assignedTo', 'name email');
        
        if (leads.length === 0) {
            return res.status(400).json({ success: false, message: 'No leads found to share' });
        }

        let csv = 'Name,Email,Phone,Source,Status,Priority,Revenue,CreatedAt\n';
        leads.forEach(lead => {
            csv += `"${lead.name}","${lead.email || ''}","${lead.phone}","${lead.source}","${lead.status}","${lead.priority || 'Medium'}",${lead.revenue},${lead.createdAt.toISOString()}\n`;
        });

        const subject = `Leads Report: ${leads.length} leads shared with you`;
        const message = customMessage || `Hi ${salesUser.name},\n\nAttached is the leads report as requested by Admin.\n\nTotal Leads: ${leads.length}\n\nRegards,\nRuzann CRM`;

        await sendEmail({
            email: salesUser.email,
            subject: subject,
            message: message,
            attachments: [
                {
                    filename: `leads_report_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`,
                    content: csv
                }
            ]
        });

        res.status(200).json({
            success: true,
            message: `Leads CSV successfully shared with ${salesUser.name} (${salesUser.email})`
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

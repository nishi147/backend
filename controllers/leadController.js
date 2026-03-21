const Lead = require('../models/Lead');
const User = require('../models/User');

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
                followUpDate: { $gte: today, $lt: tomorrow }
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
        const lead = await Lead.create(req.body);

        // Handle Referral Logic properly based on the schema
        if (lead.referralCode) {
            const User = require('../models/User');
            const Referral = require('../models/Referral');
            
            // Find referrer user by code
            const referrerUser = await User.findOne({ referralCode: lead.referralCode.toUpperCase() });
            
            if (referrerUser) {
                // Create a referral tracking doc for this lead
                await Referral.create({
                    referrer: referrerUser._id,
                    referredLead: lead._id,
                    status: 'Pending',
                    reward: 'Standard'
                });
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

        // If status changed to Converted, set convertedAt
        if (req.body.status === 'Converted' && lead.status !== 'Converted') {
            req.body.convertedAt = Date.now();
            
            // Mark associated referral as successful
            const Referral = require('../models/Referral');
            await Referral.findOneAndUpdate(
                { referredLead: lead._id },
                { status: 'Successful', reward: '₹500 Intro Bonus' }
            );
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

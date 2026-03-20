require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            family: 4
        });
        console.log('Connected to DB');

        let generalCat = await Category.findOne({ name: 'General' });
        if (!generalCat) {
            generalCat = await Category.create({ name: 'General', icon: '📚' });
            console.log('Created General category -> ID:', generalCat._id);
        }

        const db = mongoose.connection.db;
        const coursesCol = db.collection('courses');
        const courses = await coursesCol.find({}).toArray();

        console.log(`Found ${courses.length} courses to check/migrate`);

        const categoryMap = { 'General': generalCat._id };

        let updateCount = 0;

        for (const course of courses) {
            let catId = generalCat._id;
            let needsUpdate = false;
            
            if (course.category) {
                if (course.category instanceof mongoose.Types.ObjectId) {
                    // Already an ObjectId, check if it actually points to a document
                    const catExists = await Category.findById(course.category);
                    if (catExists) {
                        continue; // Perfectly fine
                    }
                    // If it points to a deleted/missing category, reset it to General
                    needsUpdate = true;
                } else {
                    const catName = course.category.toString().trim();
                    
                    if (mongoose.Types.ObjectId.isValid(catName) && new mongoose.Types.ObjectId(catName).toString() === catName) {
                        const catExists = await Category.findById(catName);
                        if (catExists) {
                            continue;
                        }
                        needsUpdate = true; // invalid ObjectId or deleted
                    } else {
                        // It's a string name
                        let mappedId = categoryMap[catName];
                        if (!mappedId) {
                            let existingCat = await Category.findOne({ name: new RegExp(`^${catName}$`, 'i') });
                            if (!existingCat) {
                                existingCat = await Category.create({ name: catName, icon: '🏷️' });
                                console.log(`Created new category: ${catName}`);
                            }
                            mappedId = existingCat._id;
                            categoryMap[catName] = mappedId;
                        }
                        catId = mappedId;
                        needsUpdate = true;
                    }
                }
            } else {
                needsUpdate = true;
            }

            if (needsUpdate) {
                await coursesCol.updateOne(
                    { _id: course._id },
                    { $set: { category: catId } }
                );
                updateCount++;
                console.log(`Updated course "${course.title}" with category ${catId}`);
            }
        }

        console.log(`Migration complete. Updated ${updateCount} courses.`);
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();

const newVersion = 1.0;

db = connect("localhost/" + databaseName);

const collectionNames = db.getCollectionNames();
if (collectionNames.indexOf('dbmetadatas') === -1){
    print('Updating Database to the version 0.1');
    db.dbmetadatas.insert({version:0.1});
}

const dbMetadata = db.dbmetadatas.findOneAndDelete({});
print('The current database version is :' + dbMetadata.version);

if(dbMetadata.version < 0.2){
    print('Updating Database to the version 0.2');
    db.equipments.update({},{$set : {"ageAcquisitionType":1, "ageUrl":""}}, {upsert:false, multi:true});
}

if(dbMetadata.version < 0.4){
    print('Updating Database to the version 0.4');

    let seed = 0;
    var myCursor = db.users.find();
    while (myCursor.hasNext()) {
        const user = myCursor.next();
        db.users.update({ _id: user._id }, {$set : { _uiId: "" + seed }}, {upsert:false, multi:true});
        seed++;
    }

    myCursor = db.equipments.find();
    while (myCursor.hasNext()) {
        const equipment = myCursor.next();
        db.equipments.update({ _id: equipment._id }, {$set : { _uiId: "" + seed }}, {upsert:false, multi:true});
        seed++;
    }

    myCursor = db.tasks.find();
    while (myCursor.hasNext()) {
        const task = myCursor.next();
        db.tasks.update({ _id: task._id }, {$set : { _uiId: "" + seed }}, {upsert:false, multi:true});
        seed++;
    }

    myCursor = db.entries.find();
    while (myCursor.hasNext()) {
        const entry = myCursor.next();
        db.entries.update({ _id: entry._id }, {$set : { _uiId: "" + seed }}, {upsert:false, multi:true});
        seed++;
    }
}

if(dbMetadata.version < 0.5){
    print('Updating Database to the version 0.5');

    const myCursor = db.entries.find();
    while (myCursor.hasNext()) {
        const entry = myCursor.next();
        db.entries.update({ _id: entry._id }, {$set : { ack: true }}, {upsert:false, multi:true});
    }
}

if(dbMetadata.version < 0.6){
    print('Updating Database to the version 0.6');

    const myCursor = db.users.find();
    while (myCursor.hasNext()) {
        const user = myCursor.next();
        db.users.update({ _id: user._id }, {$set : { forbidCreatingAsset: false, forbidUploadingImage: false }}, {upsert:false, multi:true});
    }
}

if(dbMetadata.version < 0.7){
    print('Updating Database to the version 0.7');

    const myCursor = db.users.find();
    while (myCursor.hasNext()) {
        const user = myCursor.next();
        db.users.update({ _id: user._id }, {$set : { authStrategy: 'local' }}, {upsert:false, multi:true});
    }
}

if(dbMetadata.version < 0.8){
    print('Updating Database to the version 0.8');

    const myCursor = db.users.find();
    while (myCursor.hasNext()) {
        const user = myCursor.next();
        db.users.update({ _id: user._id }, {$set : { privacyPolicyAccepted: false }}, {upsert:false, multi:true});
    }
}

if(dbMetadata.version < 0.9){
    print('Updating Database to the version 0.9');

    const myCursor = db.users.find();
    while (myCursor.hasNext()) {
        const user = myCursor.next();
        const forbidSelfDelete = user.name === 'Guest';
        db.users.update({ _id: user._id }, {$set : { forbidSelfDelete }}, {upsert:false, multi:true});
    }
}

if(dbMetadata.version < 1.0){
    print('Updating Database to the version 1.0');

    const now = Date.now();
    const myCursor = db.users.find();
    while (myCursor.hasNext()) {
        const user = myCursor.next();
        db.users.update({ _id: user._id }, {$set : { lastAuth: now }}, {upsert:false, multi:true});
    }
}

// Write the new updates on top of this line
// Finish by inserting the new version of the database
db.dbmetadatas.insert({version:newVersion});
print('Database updated to the version ' + newVersion);
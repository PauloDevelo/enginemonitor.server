const newVersion = 0.2;

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

// Finish by inserting the new version oof the database
db.dbmetadatas.insert({version:newVersion});
print('Database updated to the version ' + newVersion);
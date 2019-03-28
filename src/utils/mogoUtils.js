let saveModel = (model) => {
    return new Promise((resolve, reject) => {
        model.save(function(err, newModel){
            if(err){
                reject(err);
            }
            else{
                resolve(newModel);
            }
        });
    });
};

module.exports = { saveModel };
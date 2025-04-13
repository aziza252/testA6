const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let mongoDBConnectionString = process.env.MONGO_URL;

let Schema = mongoose.Schema;

let userSchema = new Schema({
    userName: {
        type: String,
        unique: true
    },
    password: String,
    favourites: [String],
    history: [String]
});        

let User;

module.exports.connect = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(mongoDBConnectionString);

        db.on('error', err => {
            console.error("MongoDB connection error:", err); // Improved logging
            reject(err);
        });

        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) {
        if (userData.password != userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt.hash(userData.password, 10).then(hash => {
                userData.password = hash;
                let newUser = new User(userData);
                newUser.save().then(() => {
                    resolve("User " + userData.userName + " successfully registered");  
                }).catch(err => {
                    console.error("Error creating user:", err); // Improved logging
                    if (err.code == 11000) {
                        reject("User Name already taken");
                    } else {
                        reject("There was an error creating the user: " + err);
                    }
                })
            }).catch(err => {
                console.error("Error hashing password:", err); // Improved logging
                reject(err);
            });
        }
    });
};

module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        User.findOne({ userName: userData.userName })
            .exec()
            .then(user => {
                if (!user) {
                    reject("Unable to find user " + userData.userName); // User not found
                    return; // Important: Exit the then block
                }
                bcrypt.compare(userData.password, user.password).then(res => {
                    if (res === true) {
                        resolve(user);
                    } else {
                        reject("Incorrect password for user " + userData.userName);
                    }
                });
            }).catch(err => {
                console.error("Error checking user:", err);  // Improved logging.
                reject("Unable to find user " + userData.userName); // Or,  re-throw original error  reject(err);
            });
    });
};



module.exports.getFavourites = function (id) {
    return new Promise(function (resolve, reject) {
        User.findById(id)
            .exec()
            .then(user => {
                if (!user) {
                  reject(`Unable to get favourites for user with id: ${id}. User not found.`);
                  return;
                }
                resolve(user.favourites);
            }).catch(err => {
                console.error("Error getting favorites:", err);
                reject(`Unable to get favourites for user with id: ${id}`);
            });
    });
}

module.exports.addFavourite = function (id, favId) {
    return new Promise(function (resolve, reject) {
        User.findById(id).exec().then(user => {
             if (!user) {
                  reject(`Unable to add favourites for user with id: ${id}. User not found.`);
                  return;
                }
            if (user.favourites.length < 50) {
                User.findByIdAndUpdate(
                    id,
                    { $addToSet: { favourites: favId } },
                    { new: true }
                ).exec()
                    .then(user => {
                         if (!user) {
                            reject(`Unable to update favourites for user with id: ${id}. User not found.`);
                            return;
                          }
                        resolve(user.favourites);
                    })
                    .catch(err => {
                        console.error("Error adding favorite:", err);
                        reject(`Unable to update favourites for user with id: ${id}`);
                    })
            } else {
                reject(`Unable to update favourites for user with id: ${id}.  Maximum favorites reached.`);
            }
        }).catch(err => {
             console.error("Error finding user:", err);
             reject(`Unable to add favourites for user with id: ${id}`);
        });
    });
}

module.exports.removeFavourite = function (id, favId) {
    return new Promise(function (resolve, reject) {
        User.findByIdAndUpdate(
            id,
            { $pull: { favourites: favId } },
            { new: true }
        ).exec()
            .then(user => {
                if (!user) {
                    reject(`Unable to remove favourites for user with id: ${id}. User not found.`);
                    return;
                  }
                resolve(user.favourites);
            })
            .catch(err => {
                console.error("Error removing favorite:", err);
                reject(`Unable to update favourites for user with id: ${id}`);
            })
    });
}

module.exports.getHistory = function (id) {
    return new Promise(function (resolve, reject) {
        User.findById(id)
            .exec()
            .then(user => {
                 if (!user) {
                    reject(`Unable to get history for user with id: ${id}. User not found.`);
                    return;
                  }
                resolve(user.history);
            }).catch(err => {
                console.error("Error getting history:", err);
                reject(`Unable to get history for user with id: ${id}`);
            });
    });
}

module.exports.addHistory = function (id, historyId) {
    return new Promise(function (resolve, reject) {
        User.findById(id).exec().then(user => {
             if (!user) {
                  reject(`Unable to add history for user with id: ${id}. User not found.`);
                  return;
                }
            if (user.history.length < 50) { // Corrected to check history length
                User.findByIdAndUpdate(
                    id,
                    { $addToSet: { history: historyId } },
                    { new: true }
                ).exec()
                    .then(user => {
                         if (!user) {
                            reject(`Unable to update history for user with id: ${id}. User not found.`);
                            return;
                          }
                        resolve(user.history);
                    })
                    .catch(err => {
                        console.error("Error adding history item:", err);
                        reject(`Unable to update history for user with id: ${id}`);
                    })
            } else {
                reject(`Unable to update history for user with id: ${id}.  Maximum history items reached.`);
            }
        }).catch(err => {
             console.error("Error finding  user:", err);
             reject(`Unable to add history for user with id: ${id}`);
        });
    });
}

module.exports.removeHistory = function (id, historyId) {
    return new Promise(function (resolve, reject) {
        User.findByIdAndUpdate(
            id,
            { $pull: { history: historyId } },
            { new: true }
        ).exec()
            .then(user => {
                 if (!user) {
                    reject(`Unable to remove history for user with id: ${id}. User not found.`);
                    return;
                  }
                resolve(user.history);
            })
            .catch(err => {
                console.error("Error removing history item:", err);
                reject(`Unable to update history for user with id: ${id}`);
            })
    });
}
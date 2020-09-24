const fs = require("fs");

exports.deleteFile = (path) => {
  fs.access(path, (error) => {
    // checking file exisitance
    if (!error) {
      fs.unlink(path, (err) => {
        if (err) {
          throw new Error(err);
        }
      });
    } else {
      return;
    }
  });
};

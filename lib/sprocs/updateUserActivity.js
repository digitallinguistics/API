module.exports = {
  id: 'updateUserActivity',
  serverScript: function (rid, logout) {
    var response = __.response;
    var link = __.getSelfLink() + 'docs/' + rid + '/';
    var readDocAccepted = __.readDocument(link, function (err, user) {
      if (err) { throw new Error(err); }
      else {
        user.lastActive = logout ? 0 : Date.now();
        var upsertAccepted = __.upsertDocument(__.getSelfLink(), user, function (err) {
          if (err) { throw new Error(err); }
          else { response.setBody({ status: 201, data: 'User activity timestamp successfully updated.' }); }
        });
        if (!upsertAccepted) { throw new Error('Timeout upserting user document.'); }
      }
    });
    if (!readDocAccepted) { throw new Error('Timeout reading user document.'); }
  }
};

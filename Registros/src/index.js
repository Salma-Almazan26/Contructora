const app = require('./app');

app.listen(app.get('port'));
console.log("Holaaa",app.get('port'));
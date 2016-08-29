var $ = jQuery;
var handlebars = require('handlebars');
var htmlTemplate = require('raw!./templates/info-window.html');

function InfoWindow() {

}

InfoWindow.prototype.getHtml = function(data) {
    var template = handlebars.compile(htmlTemplate);
    return template(data.f);
};

module.exports = new InfoWindow;

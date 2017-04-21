var $ = require('jquery');
var Ladda = require('ladda');
var Retina = require('retina.js').Retina;

const trackEvent = function(a, b, c) {
  if (ga !== undefined) {
    ga('send', 'event', a, b, c);
  }
}

const handle_newsletter_submit = function(e) {
  trackEvent('Button', 'Click', 'Subscribe');

  e.preventDefault();
  var $email = $(this).find('input[name=email]');
  var $submit = $(this).find('input[type=submit]');
  var l = Ladda.create(document.querySelector('.ladda-button'));
  l.start();

  if ($email.val() == '') {
    Ladda.stopAll();
    return;
  }

  $email.prop('disabled', true);
  $submit.prop('disabled', true);

  const data = {
    email: $email.val(),
    list: 'faraway'
  };
  const url = 'https://services.northplay.co/subscribe';

  $.ajax({
    url: url,
    method: 'POST',
    cache: false,
    contentType: 'application/json',
    data: JSON.stringify(data),
    success: function (data) {
      $('.newsletter__form').hide();
      $('.newsletter__thanks').show();
      Ladda.stopAll();
      trackEvent('Subscribe', 'Completed', '');
    },
    error: function (xhr, status, error) {
      $email.prop('disabled', false);
      $submit.prop('disabled', false);
      Ladda.stopAll();
      trackEvent('Subscribe', 'Failed', '');
    }
  });
};

$(document).ready(function() {
  Ladda.stopAll();
  Retina.init(window);

  $('#newsletter_form').on('submit', handle_newsletter_submit);
});

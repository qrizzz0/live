var validmail1 = "hallo@dtu.dk";
var validmail2 = "hallo.dut@dtu.dk";
var validmail3 = "hej-med-dig@hej-dk.dk";
var invalidmail1 = "hejmeddig";
var invalidmail2 = "hejmeddig@hej@dk";
var invalidmail3 = "hejmeddig@hej.dk@mark.dk";
var invalidmail4 = "hejmeddig@hej-dk";

function validateMail(mail) {
	var regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
	return regex.test(mail);
}

validateMail(validmail1);
validateMail(validmail2);
validateMail(validmail3);
validateMail(invalidmail1);
validateMail(invalidmail2);
validateMail(invalidmail3);
validateMail(invalidmail4);

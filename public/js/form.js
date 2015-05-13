validateLogin = null;
failedLogin	 = null;


failedLogin = function()
{
	$("#indexcont #login-user").val("");
	$("#indexcont #login-password").val("");
	$("#indexcont #login_failed").fadeIn(500,function()
		{
			setTimeout(function()
				{
					$("#indexcont #login_failed").fadeOut(500);			
				},2000);
		});
}

validateLogin = function(username, pass, cb){
	total = $("#indexcont .required-input").length;
	c = 0;

	$("#indexcont .required-input").each(function()
		{
			value = $(this).val();
			if (value.length == 0 || !value) //NO ES VALIDO
				{
					parent = $(this).parent();
					has_error = $(parent).has(".alert-error").length != 0
					if(!has_error)
						$(this).parent().append('<div class="alert alert-error" style="position: relative; top: -45px; left: 228px; display: none;"><strong>Campo Requerido!</strong></div>');
					$(this).addClass('input-error');
					$(parent).children('.alert-error').fadeIn(500);
				}
			else
				c++
		});

	// ALL VALIDATIONS PASSED
	if (c == total)
		cb(username,pass);
}


$(function(){
	$("#indexcont .required-input").bind("blur change paste input", function(){
		value = $(this).val();
		if (value.length == 0 || !value){
			$(this).addClass("input-error");
			parent = $(this).parent();
			$(parent).children('.alert-error').fadeIn(500);
		}
		else{
			$(this).removeClass("input-error");
			parent = $(this).parent();
			$(parent).children('.alert-error').fadeOut(500);
		}
	});
});
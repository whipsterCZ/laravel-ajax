/**
 * Laravel AJAX Support with Form Validation
 *
 * @dependency CSS BOOTSRAP >=3
 * @dependency HTML <meta name="_token" content="{!! csrf_token() !!}"/>
 * @autor Daniel Kouba whipstercz@gmail.com
 */
var laravel = (function($, laravel){
    laravel.ajax = {};
    laravel.errors = laravel.errors || {};

    //Configuration validation
    laravel.errors.errorBagContainer = $('#errors');
    laravel.errors.showErrorsBag = true;
    laravel.errors.showErrorsInFormGroup = false;

    laravel.ajax.init = function(){
        //Setting default AJAX behaviours
        $.ajaxSetup({
            success: laravel.ajax.successHandler ,
            error: laravel.ajax.errorHandler,
            headers: { 'X-CSRF-Token' : $('meta[name=_token]').attr('content') },
            dataType: "json",
            method: 'GET'
        });

        //Sending form.ajax by AJAX
        $(document).on('submit', 'form.ajax', function (event) {
            event.preventDefault();
            $.ajax({
                type: $(this).attr('method'),
                url: $(this).attr('action'),
                data: $(this).serialize(),
                context: {
                    sender: event.target,
                    url: $(this).attr('action')
                }
            })
        });

        //AJAX requests for links.ajax
        $(document).on('click','a.ajax' , function (event) {
            event.preventDefault();
            $.ajax({
                url: this.href,
                context: {
                    sender: event.target,
                    url: this.href
                }
            });
        });
    };


    //AJAX response handlers
    laravel.ajax.successHandler = function(payload) {
        //console.info('ajax success',this,  payload);
        //var sender = this.sender;
        //var url = this.url;
        //clean validation errors
        laravel.errors.clearValidation();
        // message
        if (payload.alert) {
            laravel.alert(payload.alert);
        }
        // console.info
        if (payload.dump) {
            laravel.dump(payload);
        }
        // redirect
        if (payload.redirect) {
            laravel.redirect(payload.redirect);
            return;
        }
        // redraw sections
        console.info(payload.sections.length);
        if (payload.sections) {
            laravel.redrawSections(payload.sections);
        }

        //page scrollTo elementID
        if (payload.scrollTo) {
            laravel.scrollTo(payload.scrollTo);
        }

        // eval - run js from PHP
        if (payload.runJavascript) {
            eval(payload.runJavascript);
        }
    };
    laravel.ajax.errorHandler = function(event) {
        var sender = this.sender;
        var url = this.url;
        var payload = event.responseJSON;
        var status = event.status;
        //console.info('ajax error',this,payload,event);

        if (status == 422) {  //validation Error
            laravel.errors.clearValidation(sender);
            laravel.errors.renderValidation(payload,sender);
            //laravel.alert("Sorry. There were validation errors");
        } else if (status == 403) { //forbidden
            laravel.alert("Sorry. You don't have permission for requested page")
        } else if (status == 404) { //not found
            laravel.alert('Sorry. Requested page "'+ url +'" not found')
        } else if ( status == 200) { //OK but not really :)
            laravel.alert('Sorry. Response is not valid JSON');
        } else {
            laravel.alert(event.statusText);
        }
    };


    //defining helpers
    laravel.redrawSection = function(element,html){
        if (( typeof element )=='string'){
            element = $("#" + element)
        } else {
            element = $(element);
        }
        element.html(html);
    };
    laravel.redrawSections = function(sections){
        for (var elementId in sections) {
            laravel.redrawSection(elementId,sections[elementId]);
        }
    };
    laravel.dump = function(data) {
        if (window.console) {
            console.info(data);
        }
    };
    laravel.redirect = function(url) {
        window.location.href = url;
    };
    laravel.alert = function(message){
        alert(message);
    };
    laravel.scrollTo = function(elementId) {
        $('html, body').animate({
            scrollTop: $("#"+elementId).offset().top
        }, 2000);
    };



    //laravel error handling
    laravel.errors.clearValidation = function(form) {
        //remove errorBag element id='error'
        if ( laravel.errors.showErrorsBag && laravel.errors.errorBagContainer.length>0) {
            laravel.errors.errorBagContainer.html('');
        }
        //remove existing error classes and error messages from form groups
        if ( laravel.errors.showErrorsInFormGroup) {
            $(form).find('.has-error .help-block').text('');
        }
        $(form).find('.has-error').removeClass('has-error');
    };
    laravel.errors.renderValidationErrorBag = function(errors) {
        if ( laravel.errors.showErrorsBag ) {

            var $ul = $('<ul></ul>');
            for (var fieldName in errors) {
                if (errors.hasOwnProperty(fieldName)) {
                    var fieldErrors = errors[fieldName];
                    //console.info(field,fieldErrors);
                    fieldErrors.forEach(function (error) {
                        $ul.append($('<li></li>').text(error))
                    });
                }
            }
            if ( laravel.errors.errorBagContainer.length == 0) {
                laravel.alert("ErrorBag display container haven't been found");
            }
            var $errorBag = $('<div class="alert alert-danger"></div>');
            $errorBag.append($ul);
            laravel.errors.errorBagContainer.append($errorBag);
        }
    };
    laravel.errors.renderValidationFormGroup = function(fieldName,errors,form) {
        var field = $(form).find('[name="'+fieldName+'"]');
        //var formGroup =  field.closest('.form-group');
        var formGroup = field.parent();
        //console.info(fieldName,errors,field,form);

        //add form group error class
        formGroup.addClass('has-error');
        //add form group error message
        if ( laravel.errors.showErrorsInFormGroup ) {
            var $span = formGroup.find('.help-block');
            if ($span.length == 0) {
                $span = $('<span class="help-block"></span>');
                formGroup.append($span);
            }
            $span.text(errors.join(', '));
        }
    };
    laravel.errors.renderValidation = function (errors,form) {
        form = form || document;
        //console.info(errors);

        //render errors to errorBag container
        laravel.errors.renderValidationErrorBag(errors);

        for (var fieldName in errors) {
            if (errors.hasOwnProperty(fieldName)) {
                var fieldErrors = errors[fieldName];
                //console.info(field,fieldErrors);
                laravel.errors.renderValidationFormGroup(fieldName,fieldErrors,form);
            }
        }
    };

    laravel.ajax.init();
    return laravel;
})(jQuery, laravel || {} );
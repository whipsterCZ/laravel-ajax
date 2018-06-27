/**
 * Laravel AJAX Support with Form Validation
 *
 * @dependency jQuery >=2
 * @dependency CSS BOOTSTRAP >=3
 * @dependency HTML <meta name="_token" content="{!! csrf_token() !!}"/>
 * @author Daniel Kouba whipstercz@gmail.com
 */

var factory = function () {
    var $ = window.jQuery;
    if (typeof $ !== 'function') {
        return console.error('laravel.ajax.js: jQuery is missing, load it please');
    }

    var laravel = window.laravel = window.laravel || {};

    laravel.ajax = {};
    laravel.errors = laravel.errors || {};

    //Configuration validation
    laravel.errors.errorBagContainer = $('#errors');
    laravel.errors.showErrorsBag = true;
    laravel.errors.showErrorsInFormGroup = true;

    //this is overwritten later be guessing version
    laravel.bootstrapVersion = 3;

    laravel.ajax.init = function () {
        //Adding info about submit trigger
        $("input[type=submit], button", $('form.ajax')).click(function (event) {
            var submittedBy = $(this).attr('name') || $(this).attr('value');
            $(this).closest('form').attr('data-submitted-by', submittedBy);
        });

        //Setting default AJAX behaviours
        // console.info('setting ajax headers');
        $.ajaxSetup({
            headers: {
                'X-CSRF-Token': $('meta[name=_token]').attr('content')
            }
        });

        //Sending form.ajax by AJAX
        $(document).on('submit', 'form.ajax', function (event) {
            event.preventDefault();
            $.ajax({
                type: $(this).attr('method'),
                url: $(this).attr('action'),
                data: laravel.ajax.formData(this),
                dataType: "json",
                context: {
                    sender: event.target,
                    url: $(this).attr('action')
                },
                success: laravel.ajax.successHandler,
                error: laravel.ajax.errorHandler
            })
        });

        //AJAX requests for links.ajax
        $(document).on('click', 'a.ajax', function (event) {
            event.preventDefault();
            $.ajax({
                url: this.href,
                dataType: "json",
                context: {
                    sender: event.target,
                    url: this.href
                },
                success: laravel.ajax.successHandler,
                error: laravel.ajax.errorHandler
            });
        });
    };

    //User defined custom Ajax request
    laravel.ajax.send = function(data){
        data = data || {};
        if (data.type == undefined) {
            data.type = 'GET';
        }
        if (data.dataType == undefined) {
            data.dataType = 'json';
        }
        if (data.success == undefined) {
            data.success = laravel.ajax.successHandler;
        }
        if (data.error == undefined) {
            data.error = laravel.ajax.errorHandler;
        }
        $.ajax(data);
    };


    //AJAX response handlers
    laravel.ajax.successHandler = function (payload) {
        //console.info('ajax success',this,  payload);
        //var sender = this.sender;
        //var url = this.url;
        //clean validation errors
        laravel.errors.clearValidation(this.sender);
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
        // render sections
        if (payload.sections) {
            if ( payload.drawMode == 'append') {
                laravel.appendSections(payload.sections);
            } else {
                laravel.redrawSections(payload.sections);
            }
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
    laravel.ajax.errorHandler = function (event) {
        var sender = this.sender;
        var url = this.url;
        var payload = event.responseJSON;
        var status = event.status;
        // console.info('ajax error',this,payload,event,sender);

        if (status == 422) {  //validation Error
            laravel.errors.clearValidation(sender);
            laravel.errors.renderValidation(payload, sender);
            //laravel.alert("Sorry. There were validation errors");
        } else if (status == 403) { //forbidden
            laravel.alert("Sorry. You don't have permission for requested page")
        } else if (status == 404) { //not found
            laravel.alert('Sorry. Requested page "' + url + '" not found')
        } else if (status == 200) { //OK but not really :)
            laravel.alert('Sorry. Response is not valid JSON');
        } else if (status == 0) {
            //Aborted request
        } else {
            laravel.alert(event.statusText);
        }
    };
    laravel.ajax.formData = function (form) {
        var $form = $(form);
        var data = $form.serializeArray();
        var submittedBy = $form.attr('data-submitted-by');
        //var data = $form.serialize();
        if (submittedBy != undefined) {
            data.push({name: 'submitted-by', value: submittedBy});
            data.push({name: submittedBy, value: 'submitted-by'});
        }
        return data;
    };


    //defining helpers
    laravel.redrawSection = function (element, html) {
        if (( typeof element ) == 'string') {
            element = $("#" + element)
        } else {
            element = $(element);
        }
        element.html(html);
    };
    laravel.redrawSections = function (sections) {
        for (var elementId in sections) {
            laravel.redrawSection(elementId, sections[elementId]);
        }
    };
    laravel.appendSections = function (sections) {
        for (var elementId in sections) {
            laravel.appendSection(elementId, sections[elementId]);
        }
    };
    laravel.appendSection = function (element, html) {
        if (( typeof element ) == 'string') {
            element = $("#" + element)
        } else {
            element = $(element);
        }
        element.append(html);
    };
    laravel.dump = function (data) {
        if (window.console) {
            console.info(data);
        }
    };
    laravel.redirect = function (url) {
        window.location.href = url;
    };
    laravel.alert = function (message) {
        alert(message);
    };
    laravel.scrollTo = function (elementId) {
        $('html, body').animate({
            scrollTop: $("#" + elementId).offset().top
        }, 2000);
    };


    //laravel error handling
    laravel.errors.clearValidation = function (form) {
        //remove errorBag element id='error'
        if (laravel.errors.showErrorsBag && laravel.errors.errorBagContainer.length > 0) {
            if($(form).find('.error-bag').length >0 ) {
                $(form).find('.error-bag').html('');
            } else {
                laravel.errors.errorBagContainer.html('');
            }
        }
        var errorClass = laravel.getErrorClass();
        var messageClass = laravel.getErrorMessageClass();
        //remove existing error classes and error messages from form groups
        if (laravel.errors.showErrorsInFormGroup) {
            $(form).find('.'+errorClass+' .'+messageClass).text('');
        }
        $(form).find('.'+errorClass).removeClass(errorClass);
    };
    laravel.errors.renderValidationErrorBag = function (errors,form) {
        if (laravel.errors.showErrorsBag) {

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
            if (laravel.errors.errorBagContainer.length == 0) {
                laravel.alert("ErrorBag display container haven't been found");
            }
            var $errorBag = $('<div class="alert alert-danger"></div>');
            $errorBag.append($ul);
            if($(form).find('.error-bag').length >0 ) {
                $(form).find('.error-bag').append($errorBag);
            } else {
                laravel.errors.errorBagContainer.append($errorBag);
            }

        }
    };
    laravel.errors.renderValidationFormGroup = function (fieldName, errors, form, shouldFocus) {
        //console.info(fieldName,errors,form.shouldFocus);
        var field = $(form).find('[name="' + fieldName + '"]');
        if (field.length == 0) {
            field = $(form).find('[name="' + fieldName + '[]"]');
        }
        if (field.length == 0) {
            field = $(form).find('#' + fieldName);
        }
        field = field.not('[type="hidden"]').first();
        field.addClass(laravel.getErrorClass());
        var formGroup = field.parent();
        //console.info(fieldName,errors,field,form);

        if (shouldFocus) {
            field.focus();
        }

        //add form group error class
        formGroup.addClass(laravel.getErrorClass());
        //add form group error message
        if (laravel.errors.showErrorsInFormGroup) {
            var $span = formGroup.find('.'+laravel.getErrorMessageClass());
            if ($span.length == 0) {
                $span = $('<span class="animated fadeIn '+laravel.getErrorMessageClass() +'"></span>');
                formGroup.append($span);
            }
            $span.text(errors.join(', '));
        }
    };
    laravel.errors.renderValidation = function (errors, form) {
        form = form || document;
        //console.info(errors);

        //render errors to errorBag container
        laravel.errors.renderValidationErrorBag(errors,form);

        var isFirstError = true;
        for (var fieldName in errors) {
            if (errors.hasOwnProperty(fieldName)) {
                var fieldErrors = errors[fieldName];
                //console.info(field,fieldErrors);
                fieldName = laravel.errors.sanitizeFieldName(fieldName);
                laravel.errors.renderValidationFormGroup(fieldName, fieldErrors, form, isFirstError);
                isFirstError = false;
            }
        }
    };
    laravel.errors.sanitizeFieldName = function (name) {
        // converts  notation from dot to array - offices.0.id => offices[0][id]
        var chunks = name.split(".");
        if (chunks.length > 1) {
            var sanitized = chunks[0];
            for (i = 1; i < chunks.length; i++) {
                var chunk = chunks[i];
                sanitized = sanitized + "[" + chunk + "]";
            }
            return sanitized;
        }
        return name;
    };

    laravel.guessBootstrapVersion = function(){
        return $('.form-control-label').length > 0 ? 4 : 3;
    };
    laravel.getErrorClass = function(){
        return laravel.bootstrapVersion < 4 ? 'has-error' : 'is-invalid';
    };
    laravel.getErrorMessageClass = function(){
        return laravel.bootstrapVersion < 4 ? 'help-block' : 'invalid-feedback'
    };
    laravel.bootstrapVersion = laravel.guessBootstrapVersion();

    laravel.ajax.init();

    laravel.errors.singleErrorMessage = function(event){
        // console.info('laravel.errors.payload',payload);
        var status = event.status;
        var statusText = event.statusText;
        try
        {
            var payload = JSON.parse(event.responseText);
            if(payload.error) {
                return payload.error;
            }
        } catch(e) {
            return  statusText
        }

        if (status == 422) {  //validation Error
            for (var fieldName in payload) {
                if (payload.hasOwnProperty(fieldName)) {
                    var fieldErrors = payload[fieldName];
                    //console.info(field,fieldErrors);
                    return fieldErrors.join(', ')
                }
            }
        }
        return statusText

    };

    return laravel;

};


//UMD - unified module definition
(function(name,context,factory) {
    if (typeof module != 'undefined' && module.exports)
        module.exports = factory();
    else if (typeof define == 'function' && define.amd)
        define(name, factory);
    else
        context[name] = factory();
}('laravel',this, factory));

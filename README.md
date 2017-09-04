# Ajax Workflow for Laravel

  - Provides useful tools for working with AJAX requests & JSON responses.
  - **Unobtrusive** - Same behaviour for **non-AJAX** requests with single code (no if statements)
  - YES - it can be used for processing **FORMs via AJAX** out of the box!
  - Invalid `FormRequests` **display HTML validation errors** both to *ErrorBagContainer* and *FormGroup (Optional)*
     - Uses Bootstrap CSS Form semantics. Compatible with Bootstrap 3 & 4.  
  - Support clientside **@section redraw** and **redirects**. @see `Ajax` Service
  - Only dependencies are jQuery1.8> and Laravel 4> 

Installation
------------

1) Copy source code to your existing App - directories should **match service Namespace**
~~~~~ php
app/Services/Ajax/
~~~~~

2) register service provider and Facade (Optional) in your **config/app.php**
~~~~~ php
'providers' => [
	...,
	App\Services\Ajax\ServiceProvider::class,
],
'aliases' => [
	...,
	'Ajax' => \App\Services\Ajax\Facade\Ajax::class,
]
~~~~~


3) Copy App/Services/Ajax/**laravel.ajax.js** to your **public/js** directory or run command
~~~~~ php
php artisan vendor:publish --tag=public --force
~~~~~

4) Edit your master.blade.php
~~~~~ html
  <meta name="_token" content="{!! csrf_token() !!}"/>
  <script src="/js/laravel.ajax.js"></script>
~~~~~
you can use browserify `require('laravel.ajax');` in your **app.js**

Usage
---------------------

## FrontEnd

to send your FORMs and LINKs by AJAX just add `ajax` class
~~~~~ html
<form action="" class="ajax">
<a href="ajax/my-action" class="ajax">
~~~~~

If we want redraw some html after AJAX request
~~~~~ html
<div id='snippet'>
   @include('partials/_snippet')
</div>

<!-- In case that we want redraw section-->
<div id='mySection'>
	@yield('mySection')
</div>
~~~~~

## BackEnd

Ajax Service provides you a **Factory for your response**. It is designed to simplify your work and communication with frontend.

Ajax Service recognize if request is **XmlHttpRequest** and return `JsonResponse`, in other case returns regular `Http\Response` or `Http\RedirectResponse`

### Getting service
~~~~~ php
//Dependency injection with TypeHint
public function redraw(\App\Services\Ajax\Ajax $ajax) {
	$ajax = app('ajax'); //by resolving from IoC container
	$ajax = \Ajax::instance();  //Using Facade
~~~~~

### Redrawing Views
~~~~~ php
	$ajax->redrawView('snippet'); //if we want simply redraw some HTML
	//or
	$ajax->appendView('snippet'); //if we want to append HTML instead of replace
	...
	return $ajax->view('partials/_snippet', $data )

~~~~~

~~~~~ php
	// we can redraw even @section(s) - @yield() must be wrappeed with div#sectionName.
	// Use only with good reason, it could be very uneffective.
	return $ajax->redrawSection('mySection')->view('my.template', $data);
}
~~~~~

### Redirecting
~~~~~ php
public function update(ClientRequest $request, Client $client)
{
    $client->update($request->all());
    $request->session()->flash('success', 'Client has been updated.');

	// This is also example of Ajax Facade usage
    return \Ajax::redirect(route('clients.index'));
    //or
    return \Ajax:redirectBack()
}
~~~~~

### Sending custom data
~~~~~ php
public function getData(\App\Services\Ajax\Ajax $ajax) {
	...
	$ajax->json = $data; //setting custom data
	// custom ajax success handler needed -  @see section Configuration and custom AJAX requests
	return $ajax->jsonResponse();
}
~~~~~

### Fluent API
You can utilize fluent API and with some useful methods
~~~~~ php
Route::get('test',function(\App\Services\Ajax\Ajax $ajax){
	return $ajax
		->setJson([])  //set your custom json data
		->redrawView('htmlID')
		->runJavascript('alert("hello");') //evaluate javascript
		->dump() //enable console.info after JSON is delivered
		->alert('test') //alert popup with message
		->scrollTo('elementID')
		->jsonResponse() //return JsonResponse... if you have not call view() or redirect()
	});
~~~~~

Configuration and library in depth
--------------

### Configuration
~~~~~ html
<script src="/js/laravel.ajax.js"></script>
<script>
    laravel.errors.errorBagContainer = $('#errors');
    laravel.errors.showErrorsBag = true;
    laravel.errors.showErrorsInFormGroup = false;
    laravel.bootstrapVersion = 3;
</script>
~~~~~

### Extending or modifying laravel.ajax module
~~~~~ html
<script>
    //modifying laravel.ajax handlers globally
    var laravel.ajax.originalSuccessHandler = laravel.ajax.successHandler;
    laravel.ajax.successHandler = function(payload) {
        //custom logic here

        //using one of laravel helpers
        laravel.redirect(payload.redirect);

        //or call super success handler
        laravel.ajax.originalSuccessHandler(payload);
    };

    //creating extensions or helper
    laravel.helper = function(){ ...  };
</script>
~~~~~

### How to create custom AJAX request
You can always use standard `$.ajax(options)`, but this is useful shortcut
with  *JSON* ready *X-CSRF-Token* header set.
~~~~~ html
<script>
    laravel.ajax.send({
        url: "{{ route('my.route) }}",
        type: 'GET', //optional,
        success: function(payload){} //optional - default is laravel.ajax.successHandler
        error: function(event){      //optional - default is laravel.ajax.errorHandler
		...
		laravel.ajax.errorHandler.call(this,event); //calling super handler
	} 
    });
</script>
~~~~~

### Ajax success
Ajax success request handler expect JSON containing some of these keys
~~~~~ javascript
{
	redirect: 'absoluteUrl', //page to redirect
	sections: {     //html snippets to be redrawn
	   'snippetId':'<div>HTML</div>'
	},
	dump: true, //console.info parsed JSON,
	alert: 'message', //alert('message'),
	runJavascript: 'jsCall();', //evaluate javascript code
	scrollTo: 'elementID' //scroll page to element - value is elementID
}
~~~~~

### Ajax error

If FormRequest fails after form validation it sends HTTP response **422 - Unprocessable Entity** which is recognized and process with `laravel.ajax.errorHandler` function.
This function recognize which error occurred and automatically displays validation errors to the Form which sent the data...

### How to create Validation Error Response manually
~~~~~ php
public function store()
{
    ...
    $validator = Validator::make(Input::all(), $rules);
	if ($validator->fails()) {
		//if request is AJAX it only sends `422 Error Response` and redirect will not be used..
		//@see previous section
        return \Ajax::redirectWithErrors(route('someRoute'),$validator);
    }
}
~~~~~

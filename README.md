# Laravel-Ajax

  - Provides useful tools for working with AJAX requests & JSON responses.
  - **Unobtrusive** - Same behaviour for **non-AJAX** requests with single code (no if statements)
  - YES - it can be used for processing **FORMs via AJAX** out of the box!
  - Invalid `FormRequests` **display HTML validation errors** both to *ErrorBagContainer* and *FormGroup (Optional)*
  - Support clientside **@section redraw** and **redirects**. @see `Ajax` Service
  - Only dependencies are jQuery1.8> nad Laravel 4> 

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

Usage
---------------------

## FrontEnd

to AJAXify your HTML just add `ajax` class to your Forms or Anchors
~~~~~ html
<form action="" class="ajax">
<a href="" class="ajax">
~~~~~

### Ajax success
Ajax success request handler expect JSON containing some of these keys
~~~~~ javascript
{
	redirect: 'absoluteUrl', //page to redirect
	sections: {     //html sections for redraw
	   'sectionID':'<div>HTML</div>'
	},
	dump: true, //console.info parsed JSON,
	alert: 'message', //alert('message'),
	runJavascript: 'jsCall();', //evaluate javascript code
	scrollTo: 'elementID' //scroll page to element - value is elementID
}
~~~~~

### Ajax error
**Ajax error** request handler recognize which error occurs.
in case of Error **422 Unprocessable Entity** display validation errors

### Configuration, extending or modifying laravel.ajax module
~~~~~ html
<script src="/js/laravel.ajax.js"></script>
<script>
    laravel.errors.errorBagContainer = $('#errors');
    laravel.errors.showErrorsBag = true;
    laravel.errors.showErrorsInFormGroup = false;

    //modifying laravel.ajax handlers
    var laravel.ajax.superSuccessHandler = laravel.ajax.successHandler;
    laravel.ajax.successHandler = function(payload) {
        //custom logic here

        //using one of laravel helpers
        laravel.redirect(payload.redirect);

        //or call super success handler
        laravel.ajax.superSuccessHandler();
    };
    
    //creating extensions or helper 
    laravel.helper = function(){ ...  };
 </script>
~~~~~

## BackEnd

Ajax Service provides you a **Factory for your response**. It is designed to simplify your work and communication with frontend.

Ajax Service recognize if request is **XmlHttpRequest** and return `JsonResponse`, in other case returns regular `Http\Response` or `Http\RedirectResponse`

###Getting service
~~~~~ php
//Dependency injection with TypeHint
public function(\App\Services\Ajax\Ajax $ajax) {
	$ajax = app('ajax'); //by resolving from IoC container
	$ajax = \Ajax::instance();  //Using Facade
~~~~~

###Rendering Views
~~~~~ php
	$ajax->redrawSection('comments');  // we can redraw section(s) if view has @section(s)
	//or
	$ajax->redrawView('htmlID'); //if view don't have any sections.
	//or
	$ajax->appendView('htmlID'); //if we want to append HTML instead of replace
	...
	return $ajax->view('posts.show', $data )
}
~~~~~

###Redirecting
~~~~~ php
public function update(ClientRequest $request, Client $client)
{
    $client->update($request->all());
    $request->session()->flash('success', 'Client has been updated.');

    return \Ajax::redirect(route('clients.index'));
}
~~~~~

###Sending custom data
~~~~~ php
public function getData(\App\Services\Ajax\Ajax $ajax) {
	...
	$ajax->json = $data; //setting custom data (custom ajax success handler needed)
	return $ajax->jsonResponse();
}
~~~~~

###Manually Creating Validation Error Response
~~~~~ php
public function store()
{
    ...
    $validator = Validator::make(Input::all(), $rules);
	if ($validator->fails()) {
		//if request is AJAX it only creates 422 Error Response and route will not be used..  
        return \Ajax::redirectWithErrors(route('someRoute'),$validator); 
    }
}
~~~~~


###Fluent API
You can also use helper methods with fluent API
~~~~~ php
Route::get('test',function(\App\Services\Ajax\Ajax $ajax){
	return $ajax
		->setJson([])  //set your custom json data
		->redrawSection('content') // redraw HTML inside element HTML with id="content"
		->runJavascript('alert("hello");') //evaluate javascript
		->dump() //enable console.info of sent JSON
		->alert('test') //alert popup with message
		->scrollTo('elementID')
		->view('crm.clients.test');
});
~~~~~



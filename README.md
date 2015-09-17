# Laravel-Ajax : javascript + Laravel Extension - AjaxService

Helps automate javascript ajax requests and JSON responses.

For invalid FormRequests it renders HTML validation errors - to ErrorBagContainer and FormGroup (Optional)
If JSON contains redirect key it redirects page. @SEE AjaxService


Installation
------------

1) Add source code to your existing App - directories should **match service Namespace**
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


3) Copy **laravel.ajax.js** to your **public/js** directory or run command
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

to AJAXify your HTML just add 'ajax' class to your Forms or Anchors
~~~~~ html
<form action="..." class="ajax">
<a href="..." class="ajax">
~~~~~

ajax success request handler expect JSON containing some of these keys
~~~~~ json
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

ajax error request handler recognize which error occurs.
in case of Error **422 Unprocessable Entity** - Show validation errors

javascript validation configuration
~~~~~ javascript
    laravel.errors.errorBagContainer = $('#errors');
    laravel.errors.showErrorsBag = true;
    laravel.errors.showErrorsInFormGroup = false;
~~~~~

## BackEnd

Ajax Service provides you a Factory for your response. It is designed to simplify your work and communication with frontend.

Ajax Service also recognize if request is **XmlHttpRequest** and return **JsonResponse**, in other case returns regular Http\Response or Http\RedirectResponse

Getting service
~~~~~ php
//Dependency injection with TypeHint
public function(\App\Services\Ajax\Ajax $ajax) {
	$ajax = app('ajax'); //by resolving from IoC container
	\Ajax::redirect(route('home'));  //Using Facade
}
~~~~~

Rendering or sending data
~~~~~ php
	$ajax->redrawSection('comments');
	...
	return $ajax->view('posts.show', $data )
~~~~~

Redirecting
~~~~~ php
    public function update(ClientRequest $request, Client $client)
    {
        $client->update($request->all());
        $request->session()->flash('success', 'Client has been updated.');

	    return \Ajax::redirect(route('clients.index'));
    }
~~~~~

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



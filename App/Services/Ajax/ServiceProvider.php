<?php

namespace App\Services\Ajax;

use App\Services\Ajax\Ajax;

class ServiceProvider extends  \Illuminate\Support\ServiceProvider
{
    /**
     * Bootstrap the application services.
     *
     * @return void
     */
    public function boot()
    {
	    $this->app->singleton('ajax', Ajax::class);

	    //php artisan vendor:publish --tag=public --force
	    $this->publishes([
		    __DIR__.'/laravel.ajax.js' => public_path('js/laravel.ajax.js')
	    ], 'public');
    }

    /**
     * Register the application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }
}

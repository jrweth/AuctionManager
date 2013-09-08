/**
 * backbone-scaffold.js 0.0.1
 * (c) 2013 J. Reuben Wetherbee and contributors (https://github.com/jrweth/backbone-scaffold/graphs/contributors)
 * 
 * backbone-scaffold may be freely distributed under the MIT license; see the accompanying LICENSE.txt.
 * For details and documentation: https://github.com/jrweth/backbone-scaffold.
 * Depends on Backbone (and thus on Underscore as well): https://github.com/documentcloud/backbone.
 * Also Depends upon https://github.com/PaulUithol/Backbone-relational
 */
( function( undefined ) {
	"use strict";
	
	
	/**
	 * CommonJS shim
	 **/
	var $, _, Backbone, BackboneScaffold;
	
	if ( typeof window === 'undefined' ) {
		$ = require( 'jquery');
		_ = require( 'underscore' );
		Backbone = require( 'backbone' );
	}
	else {
		$ = window.jQuery;
		_ = window._;
		Backbone = window.Backbone;
		BackboneScaffold = window.BackboneScaffold = function(options){ this.init(options)};
	}

	$.fn.serializeObject = function()
	{
		var o = {};
		var a = this.serializeArray();
		$.each(a, function() {
			if (o[this.name] !== undefined) {
				if (!o[this.name].push) {
					o[this.name] = [o[this.name]];
				}
				o[this.name].push(this.value || '');
			} else {
				o[this.name] = this.value || '';
			}
		});
		return o;
	};
	
	
	
	BackboneScaffold.prototype.init = function(init) {
		//set the models
		this.modelDefs = init.modelDefs;
		
		//loop through the option keys and override defaults if specified
		for( var optionKey in this.defaults) {
			if (init[optionKey] != undefined) {
				this[optionKey] = _.defaults(init[optionKey], this.defaults[optionKey]);
			}
			else {
				this[optionKey] = this.defaults[optionKey];
			}
		}
		
		this.initModels();
	};
	
	/**
	 * Set up some initial model attributes for each model
	 */
	BackboneScaffold.prototype.initModels = function() {
		//assign default values to the modelDefs
		for( var modelName in this.modelDefs) {
			var modelDefaults = {apiName: modelName, label: modelName.replace(new RegExp('_', 'g'), ' ')};
			_.defaults(this.modelDefs[modelName], modelDefaults);
			_.defaults(this.modelDefs[modelName], this.modelDef);
			
			//loop through each column and set defaults
			for( var columnName in this.modelDefs[modelName].columns) {
				var columnDefaults = {label: columnName.replace(new RegExp('_', 'g'), ' ')};
				_.defaults(this.modelDefs[modelName].columns[columnName], columnDefaults);
				_.defaults(this.modelDefs[modelName].columns[columnName], this.columnDef);
			}
			
		}
		
	};
	
	/**
	 * Log debug messages if logging is on
	 */
	BackboneScaffold.prototype.debugLog = function(message) {
		if(this.options.debug == true) {
			console.log(message);
		}
	};
	
	/*
	 * Setup the full scaffolding for all the modelDefs passed in 
	 */
	BackboneScaffold.prototype.setupScaffold = function(jqContainerSelector) {
		this.debugLog('setup scaffold');
		
		//get the scaffold container element and append the template
		this.$scaffold = $(jqContainerSelector);
		var scaffoldTemplate = _.template(this.templates.scaffold);
		this.$scaffold.append(scaffoldTemplate());
		
		
		//initialize the menu
		this.initModelMenu();

		//start the router
		this.router = new this.router();
		this.router.scaffold = this;
		Backbone.history.start();
		
		//return for chainability
		return this;
	};
	
	/**
	 * Initialize the menu of models that can be edited
	 */
	BackboneScaffold.prototype.initModelMenu = function() {
		this.debugLog('initMenu');
		
		//get the 
		var menu = this.elementGetters.modelMenu(this.$scaffold);
		var template = _.template(this.templates.modelMenuItem);
		
		for(var modelName in this.modelDefs) {
			if(this.modelDefs[modelName].showInMenu) {
				menu.append(template({name: modelName, label: this.modelDefs[modelName].label}));
			}
		}
	};
	
	/**
	 * Display the Model
	 */
	BackboneScaffold.prototype.renderModel = function(modelName) {
		this.debugLog('rendering model: ' + modelName);

		var reRenderModel = function(scaffold, modelName) {
			return function() {
				scaffold.renderModel(modelName);
			}
		};
		
		//make sure that the collection has already been initialized
		if(this.modelDefs[modelName].collectionInitializationStatus == 'not initialized') {
			this.initModel(modelName);
			setTimeout(reRenderModel(this, modelName), 250);
			return false;
		}
		//if it is in the process of initializing, just wait a bit
		else if(this.modelDefs[modelName].collectionInitializationStatus == 'initializing') {
			setTimeout(reRenderModel(this, modelName), 250);
			return false;
		}
		

		//if display is already  initialized, don't try it again
		if(this.modelDefs[modelName].displayInitializationStatus == 'initialized') {
			return true;
		}

		//if display is in process initialized, don't try it again
		if(this.modelDefs[modelName].displayInitializationStatus == 'initializing') {
			return false;
		}
		
		if(this.modelDefs[modelName].displayInitializationStatus == 'not initialized') {
			this.modelDefs[modelName].displayInitializationStatus = 'initializing';
			this.modelDefs[modelName].backboneView = new this.views.modelView({
				el: ".bbs-model-" + modelName,
				modelDef: this.modelDefs[modelName],
				modelName: modelName,
				scaffold: this
			});
		}
		

		this.modelDefs[modelName].displayInitializationStatus = 'initialized';
	};
		
	BackboneScaffold.prototype.displayModel = function(modelName) {
		this.debugLog('displaying model: ' + modelName);
		
		var reDisplayModel = function(scaffold, modelName) {
			return function() {
				scaffold.displayModel(modelName);
			}
		};
		//if the view has not yet been set up then render it and come back later
		//get the list element
		var $list = this.elementGetters.modelList(this.$scaffold, modelName);
		var $model = this.elementGetters.model(this.$scaffold, modelName);
		
		if(this.modelDefs[modelName].displayInitializationStatus == 'not initialized') {
			this.renderModel(modelName);
			setTimeout(reDisplayModel(this, modelName), 250);
			return false;
		}
		else if(this.modelDefs[modelName].displayInitializationStatus == 'initializing') {
			setTimeout(reDisplayModel(this, modelName), 250);
			return false;
		}
		
		//make sure that the list section is displayed
		$list.siblings().hide();
		$list.show();
		
		//hide all the other modelDefs
		this.$scaffold.find('.bbs-model').hide(100);
		
		//show this model
		$model.show(100);
	};
	
	/**
	 * Initialize the model collection
	 */
	BackboneScaffold.prototype.initModel = function(modelName) {
		this.debugLog('initializing model:' + modelName);
		
		if(this.modelDefs[modelName].collectionInitializationStatus == 'not initialized') {
			this.modelDefs[modelName].collectionInitializationStatus = 'initializing';
		}
		
		var reInitModel = function(scaffold, modelName) {
			return function(collection) {
				scaffold.initModel(modelName);
			}
		};
		
		//check to see if related model are already instantiaed, if not instantiate and then come back and initialize this one
		for(var relatedModelName in this.modelDefs[modelName].relatedModels) {
			//related model not yet instantiated - instantiate now and come back later
			if(this.modelDefs[relatedModelName].collectionInitializationStatus == 'not initialized') {
				this.initModel(relatedModelName);
			}
		}
		
		var cols = this.modelDefs[modelName].columns
		var defaults = {};
		for(var colName in cols){
			if (cols[colName].defaultValue != undefined) {
				defaults[colName] = cols[colName].defaultValue;
			}
		}
		//initialize the Backbone Model Class
		this.modelDefs[modelName].backboneModel = Backbone.RelationalModel.extend({
			urlRoot: this.options.apiRoot + modelName,
			modelName: modelName,
			columns: this.modelDefs[modelName].columns,
			defaults: defaults
		});
		
		//initialize the Backbone Collection Class
		var Collection = Backbone.Collection.extend({
			model: this.modelDefs[modelName].backboneModel,
			url: this.options.apiRoot + '/' + modelName
		});
		
		//instantiate the Backbone Collection Class and add to our model
		this.modelDefs[modelName].backboneCollection = new Collection([], {comparator: this.modelDefs[modelName].comparator});
		
		var fetchCollectionSuccess = function(scaffold, modelName) {
			return function(collection) {
				scaffold.debugLog(modelName + ' collection initialized');
				scaffold.modelDefs[modelName].collectionInitializationStatus = 'initialized';
				//create the model div
				
				var modelDivTemplate = _.template(scaffold.templates.model);
				
				scaffold.$scaffold.find('.bbs-models').append(modelDivTemplate({name: modelName, label: scaffold.modelDefs[modelName].label}));
			}
		};
		
		//fetch the data
		this.modelDefs[modelName].backboneCollection.fetch({
			success: fetchCollectionSuccess(this, modelName)
		});

	};
	
	
	//------------------------------
	// Standard Template Definitions
	//------------------------------
	BackboneScaffold.prototype.defaults = {
		options: {},		 //top level options
		modelDef: {},		//defaults for models
		columnDef: {},	   //defaults for columns
		elementGetters: {},  //functions for retrieving jquery objects for various scaffold DOM elements
		templates: {},	   //html templates for scaffolding elements
		views: {},		   //standard backbone views
		router: {}		   //backbone.js router
	}
	
	BackboneScaffold.prototype.defaults.options = {
		debug: false,
		apiRoot: 'api'
	};

	BackboneScaffold.prototype.defaults.modelDef = {
		modelToString: function(model, modelDef, scaffold) {
			var string = '';
			for ( var columnName in modelDef.columns) {
				string = string + model.get(columnName) + ', '
			}
			string = string.substring(0,string.length -1);
			return string;
		},
		showInMenu: true,
		collectionInitializationStatus: 'not initialized',
		displayInitializationStatus: 'not initialized',
		comparator: 'id'
	};
	
	BackboneScaffold.prototype.defaults.columnDef = {
		type: 'string',	   //type of variable string, primaryId, integer, decimal, date, file
		length: '',		   //maximum length of the string
		label: '',			//if not set defaults to column key
		listDisplayView: 'modelColumnValue', //none, modelColumnValue, modelColumnManyToManyModelToString, modelColumnHasManyModeltoString, modelColumnDate, lookup
		editDisplayView: 'modelEditColumnText',  //
		editDisplayTemplate: 'modelEditColumnText',  //
		lookupCollection: '',  //collection to create the options for lookup
		lookupOptions: [],	 //array of lookup options e.g. [{value: 0; display: 'No'}, {value: 1, display: 'Yes'}]
		dropDownEmptyOption: 'Select ...'   //for dropdowns an empty option
	};
	
	BackboneScaffold.prototype.defaults.elementGetters = {
		modelMenu: function ($scaffold) { return $scaffold.find('.bbs-modelMenu'); },
		scaffold: function ($scaffold) { return $scaffold },
		model: function($scaffold, modelName) { return $scaffold.find('.bbs-model-' + modelName); },
		modelList: function($scaffold, modelName) { return $scaffold.find('.bbs-model-' + modelName + ' .bbs-modelList'); },
		modelListTable: function($scaffold, modelName) { return $scaffold.find('.bbs-model-' + modelName + ' .bbs-modelListTable'); },
		modelEdit: function($scaffold, modelName) { return $scaffold.find('.bbs-model-' + modelName + ' .bbs-modelEdit'); },
	};
	
	
	BackboneScaffold.prototype.defaults.templates = {
		scaffold: '<div class="bbs-scaffold"><nav class="bbs-modelMenu"></nav><div class="bbs-models"></div>',
		modelMenu: '<div></div>',
		modelMenuItem: '<li class="bbs-modelMenuItem"><a href="#/<%= name %>"><%- label %></a></li>',
		model: '<div class="bbs-model bbs-model-<%- name %>" style="display: none"> \
					<div class="bbs-modelHeader"><%- label %></div> \
					<div class="bbs-modelSubSections"> \
						<div class="bbs-modelList bbs-modelSubSection"> \
							<div class="bbs-modelAddNew"> \
								<button class="bbs-addNew">add new</button> \
							</div> \
						</div> \
						<div class="bbs-modelEdit bbs-modelSubSection"></div> \
						<div class="bbs-modelDetail bbs-modelSubSection"></div> \
					</div> \
				</div>',
		//table templates
		modelListTable: '<table class="bbs-modelListTable"><thead><th>&#160</th> \
						<% for(columnName in columns) { if (columns[columnName].listDisplayView != "none") {%> \
							<th><%- columns[columnName].label %></th> \
						<% }} %> \
						</thead><tbody></tbody></table>',
		modelListTableActions: '<td> \
				<button class="bbs-edit">edit</button> \
				<button class="bbs-delete">delete</button> \
			</td>',
		modelColumnValue: '<%- value %>',
		modelListTableCollectionLookup: '<td> \
			<% if (value) { \
				var relatedModel = scaffold.modelDefs[colDef.relatedModelName].backboneCollection.get(value);  \
				print(scaffold.modelDefs[colDef.relatedModelName].modelToString(relatedModel, scaffold.modelDefs[colDef.relatedModelName], scaffold)); \
			} %></td>',
		modelListTableCollectionHasMany: '<td><ul><% \
				for(var index in relatedModels) print("<li>" + relatedModelDef.modelToString(relatedModels[index], relatedModelDef, scaffold) + "</li>") \
			%></ul></td>',
		//edit templates
		modelEditColumnText: '<label><%- label %></label> \
						<div><input class="bbs-editInputText" name="<%= columnName %>" value="<%= value %>" /></div>',
		modelEditColumnTextArea: '<label><%- label %></label> \
			<div><textarea class="bbs-editInputTextArea" name="<%= columnName %>"><%= value %></textarea></div>',
		modelEditColumnDropdown: '<label><%- label %></label> \
			<div><select class="bbs-editInputSelect" name="<%= columnName %>" > \
				<% if(emptyOption != undefined) { %> \
					<option value=""><%- emptyOption %></option> \
				<% } %> \
				<% for( var i in options) { %> \
					<option value="<%- options[i].value %>" \
					<% if(options[i] == value) { %> selected="selected" <% } %> \
					><%- options[i].display %></option> \
				<% } %> \
			</select></div>',
		modelEditCollectionAssociationMany: '<div class="bbs-editColumn"> \
			<label><%- label %></label> \
			<div><select class="bbs-editInputSelect" name="<%= columnName %>" > \
				<% if(colDef.emptyOption != undefined) { %><option value=""><%- colDef.emptyOption %></option><% } %> \
				<% scaffold.modelDefs[colDef.relatedModelName].backboneCollection.each( function(model) { \
					print("<option value=\'" + model.get("id") + "\'>" + colDef.relatedModelToString(model) + "</option>"); }) %> \
			</select></div> \
		</div>',
		modelEditColumnHidden: '<input type="hidden" class="bbs-editInputHidden" name="<%= columnName %>" value="<%= value %>" />',
		modelEditActions: '<div class="bbs-editActions"> \
				<button class="bbs-save">save</button> \
				<button class="bbs-cancel"">cancel</button> \
			</div>',
		modelEditRemoveRelated: '<a class="bbs-delete" style="cursor: pointer">remove</a>',
		modelEditAddRelated: '<a class="bbs-addRelated" style="cursor: pointer">add</a>',
		sortableHandle: '<span class="handle" data-bbs-modelId="<%= modelId %>">:::</span>',
		detail: function (model, columns, options) {},
		dropDown: function (model, columns, options) {},
		lookup: function(model, columns, options) {}
	};
	
	BackboneScaffold.prototype.defaults.views = {
		modelView: Backbone.View.extend({
			initialize: function() {
				//set up local variable from those passed in on creation of new object
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.modelDef = this.options.modelDef;
				this.collection = this.options.modelDef.backboneCollection;
				
				//bind collection events
				this.collection.on('add', this.addAll, this);
				this.collection.on('reset', this.addAll, this);
				
				//bind collection events for related tables
				var relatedModels = this.scaffold.modelDefs[this.modelName].relatedModels
				for(var relatedModelKey in relatedModels)
				{
					var relatedModelName = relatedModels[relatedModelKey].relatedModelName;
					var relatedCollection = this.scaffold.modelDefs[relatedModelName].backboneCollection;
					//relatedCollection.on('add', this.addAll, this);
					//relatedCollection.on('reset', this.addAll, this);
					//relatedCollection.on('remove', this.relatedModelRemoved, this);
					//relatedCollection.on('change', this.addAll, this);
				}
				
				//setup the table
				var tableTemplate = _.template(this.scaffold.templates.modelListTable);
				this.$el.find('.bbs-modelList').append(tableTemplate({columns: this.modelDef.columns}));
				
				_.bindAll(this, "addNew");

				this.addAll();
			},
			events: {
				'click .bbs-addNew' : 'addNew'
			},
			addNew: function() {
				this.scaffold.debugLog('Add New: ' + this.modelName);
				this.scaffold.router.navigate('model/' + this.modelName + '/insert', {trigger: true});
			},
			addOne: function(model) {
				var view = new this.scaffold.views.modelTableRow({
					model: model,
					modelName: this.modelName,
					modelDef: this.modelDef,
					scaffold: this.scaffold
				});
				this.$el.find('.bbs-modelListTable tbody').append(view.render().$el);
			},
			addAll: function() {
				this.scaffold.debugLog('Adding All rows for model ' + this.modelName);
				this.$el.find('.bbs-modelListTable tbody').html(''); // clean the list
				this.collection.each(this.addOne, this);
			},
			relatedModelRemoved: function() {
				this.collection.fetch();
				this.addAll();
			}
		}),
		
		modelTableRow: Backbone.View.extend({
			tagName: 'tr',
			initialize: function(){
				//set up local variable from those passed in on creation of new object
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.modelDef = this.options.modelDef;
				
				this.model.on('destroy', this.remove, this); // remove: Convenience Backbone's function for removing the view from the DOM.
			},
			events: {
			  'click .bbs-edit' : 'edit',
			  'click .bbs-delete' : 'delete'
			},
			render: function() {
				//add the action cell
				this.$el.html('');
				var actionCellTemplate = _.template(this.scaffold.templates.modelListTableActions);
				this.$el.append(actionCellTemplate({model: this.model}));
				

				//loop through all of the columns and append each
				var cols = this.modelDef.columns;
				for( var colName in cols) {
					var colDef = cols[colName];
					
					//get the template based upon the display type 
					var listDisplayView = cols[colName].listDisplayView;
					
					//default to the text display type
					if (listDisplayView == undefined) {
						listDisplayView = 'modelColumnValue';
					}
					
					if (listDisplayView != 'none') {
						//create the view
						var columnView = new this.scaffold.views[listDisplayView]({
							tagName: 'td',
							scaffold: this.scaffold,
							modelName: this.modelName,
							columnName: colName,
							model: this.model
						});
						//append the rendered view's element to this rows element
						this.$el.append(columnView.render().$el);
					}
				}
				
				return this;
			},
			edit: function () {
				this.scaffold.router.navigate('model/' + this.modelName + '/edit/' + this.model.get('id'), {trigger: true});
			},
			delete: function() {
				if(confirm('Are you sure you want to delete this record?')) {
					this.scaffold.debugLog('deleting ' + this.modelName);
					this.model.destroy({wait: true, error: function(response) {alert('There was an error deleting the record');}});
				}
			}
		}),
		// ------------------
		// Edit View
		// __________________
		modelEdit:  Backbone.View.extend({
			initialize: function() {
				//set up local variable from those passed in on creation of new object
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.modelDef = this.options.modelDef;
				this.collection = this.modelDef.backboneCollection;
				this.embeddedForms = [];
				if(typeof this.options.isEmbeddedForm == 'undefined') {
					this.isEmbeddedForm = false;
				}
				else {
					this.isEmbeddedForm = this.options.isEmbeddedForm;
				}
				
				this.columnViews = [];
				
				this.scaffold.debugLog('initializing model edit');
				_.bindAll(this, "saveSuccess");
				this.render();
			},
			render: function() {
				//determine if this is a primary or an embedded form and set the header appropriately
				if(this.isEmbeddedForm) {
					this.$el.html('<form class="bbs-embeddedEditForm"></form>');
				}
				else {
					this.$el.html('<form class="bbs-primaryEditForm"></form>');
				}
				
				var $form = this.$el.children("form");
				
				//instantiate all of the column templates
				var cols = this.modelDef.columns;
				for( var colName in cols) {
					//get the template based upon the display type 
					var displayView = cols[colName].editDisplayView;
					
					//default to the text display type
					if (displayView == undefined) {
						displayView = 'modelEditColumnText';
					}
					
					if (displayView != 'none') {
						var $columnDiv = $('<div class="bbs-columnEdit"></div>');
						$form.append($columnDiv);
						console.log(displayView);
						var columnView = new this.scaffold.views[displayView]({
							el: $columnDiv,
							scaffold: this.scaffold,
							modelName: this.modelName,
							columnName: colName,
							model: this.model,
						});
						
						columnView.render();
						this.columnViews.push(columnView);
					}
				}
				
				if(this.isEmbeddedForm == false) {
					var editActionsTemplate = _.template(this.scaffold.templates.modelEditActions);
					this.$el.append(editActionsTemplate({modelName: this.modelName, modelDef: this.modelDef, scaffold: this.scaffold}));
				}
				
				return this;
			},
			events: {
				'click .bbs-save' : 'save',
				'click .bbs-cancel' : 'cancel'
			},
			save: function () {
				this.model.save(this.$el.children('form').serializeObject(), {
					wait: true,
					error: function(model, error){ alert(error.responseText);},
					success: this.saveSuccess
				});
			},
			saveSuccess: function(model, response) {
				this.collection.add(model);
				console.log('added to collection' + this.modelName);	
				//save the embedded forms
				for(var i in this.columnViews) {
					if (this.columnViews[i].saveEmbeddedForms != undefined) {
						this.columnViews[i].saveEmbeddedForms(model);
					}
				}
				this.$el.hide();
				this.undelegateEvents();
				if(this.isEmbeddedForm == false) {
					this.scaffold.router.navigate('model/' + this.modelName, {trigger: true});
				}
			},
			cancel: function() {
				this.undelegateEvents();
				this.scaffold.router.navigate('model/' + this.modelName, {trigger: true});
			}
		}),
		modelEditColumnText: Backbone.View.extend({
			initialize: function() {
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.columnName = this.options.columnName;
				this.model = this.options.model;
				
				this.modelDef = this.scaffold.modelDefs[this.modelName];
				this.columnDef = this.modelDef.columns[this.columnName];
				this.template = _.template(this.scaffold.templates[this.columnDef.editDisplayTemplate]);
			},
			render: function() {
				this.$el.html(this.template({
					label: this.columnDef.label,
					columnName: this.columnName,
					value: this.model.get(this.columnName)
				}));
			}
		}),
		modelEditColumnCollectionDropdown: Backbone.View.extend({
			initialize: function() {
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.columnName = this.options.columnName;
				this.model = this.options.model;
				
				this.modelDef = this.scaffold.modelDefs[this.modelName];
				this.columnDef = this.modelDef.columns[this.columnName];
				this.relatedModelName = this.columnDef.relatedModelName;
				this.relatedModelDef = this.scaffold.modelDefs[this.relatedModelName];
				this.relatedCollection = this.relatedModelDef.backboneCollection;
				this.relatedModelToString = this.relatedModelDef.modelToString;
				this.template = _.template(this.scaffold.templates['modelEditColumnDropdown']);
			},
			render: function() {
				var options = [];
				for (var i = 0; i < this.relatedCollection.length; i++) {
					var relatedModel = this.relatedCollection.at(i);
					options[i] = {
						value: relatedModel.get('id'),
						display: this.relatedModelToString(relatedModel, this.relatedModelDef, this.scaffold)
					};
				}
				this.$el.html(this.template({
					label: this.columnDef.label,
					columnName: this.columnName,
					value: this.model.get(this.columnName),
					options: options,
					emptyOption: this.columnDef.emptyOption
				}));
			}
		}),
		modelEditColumnHidden: Backbone.View.extend({
			initialize: function() {
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.columnName = this.options.columnName;
				this.model = this.options.model;
				
				this.modelDef = this.scaffold.modelDefs[this.modelName];
				this.columnDef = this.modelDef.columns[this.columnName];
				this.template = _.template(this.scaffold.templates['modelEditColumnHidden']);
			},
			render: function() {
				this.$el.html(this.template({
					label: this.columnDef.label,
					columnName: this.columnName,
					value: this.model.get(this.columnName)
				}));
			}
		}),
		modelEditHasManyDeleteInsert: Backbone.View.extend({
			initialize: function() {
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.columnName = this.options.columnName;
				this.model = this.options.model;
				
				this.modelDef = this.scaffold.modelDefs[this.modelName];
				this.columnDef = this.modelDef.columns[this.columnName];
				this.relationDef = this.modelDef.relatedModels[this.columnDef.relatedModelKey];
				this.relatedModelName = this.relationDef.relatedModelName;
				this.relatedModelDef = this.scaffold.modelDefs[this.relatedModelName];
				
				this.embeddedForms = [];
			},
			events: {
				'click a.bbs-addRelated' : 'addRelated'
			},
			render: function() {
				//create a blank list
				this.$el.css('border', '1px solid black');
				this.$el.html('<label>' + this.columnDef.label + '</label>');
				this.$ul = $('<ul></ul>');
				this.$el.append(this.$ul);
				
				//get the query for the related columns
				var whereDef = {};
				whereDef[this.relationDef.relatedJoinColumn] = this.model.get(this.relationDef.joinColumn);
				var relatedModels = this.relatedModelDef.backboneCollection.where(whereDef);
				
				//loop through each related model and add a list item to the view
				for (var i in relatedModels) {
					var modelToStringView = new this.scaffold.views.modelToStringWithDelete({
						tagName: 'li',
						scaffold: this.scaffold,
						modelName: this.relatedModelName,
						model: relatedModels[i]
					});
					this.$ul.append(modelToStringView.render().$el);
				}
				var template = _.template(this.scaffold.templates.modelEditAddRelated);
				this.$el.append(template({type:  this.columnDef.label }));
				return this;
			},
			addRelated: function(ev) {
				console.log(ev.currentTarget);
				var newModel = new this.relatedModelDef.backboneModel();
				newModel.set(this.relationDef.relatedJoinColumn, this.model.get(this.relationDef.joinColumn));
				
				//hide the related item but save original display form to restore after initializing the view
				var origEditDisplayView = this.relatedModelDef.columns[this.relationDef.relatedJoinColumn].editDisplayView;
				this.relatedModelDef.columns[this.relationDef.relatedJoinColumn].editDisplayView = 'modelEditColumnHidden';
				
				//set the related column in the other model to hidden since we are joining on it
				this.relatedModelDef.columns[this.relationDef.relatedJoinColumn].editDisplayType = 'hidden';
				var view = new this.scaffold.views.modelEdit({
					model: newModel,
					modelDef: this.relatedModelDef,
					modelName: this.relatedModelName,
					scaffold: this.scaffold,
					isEmbeddedForm: true
				})
				this.$ul.append(view.render().$el);

				this.embeddedForms.push(view);
				
				//turn back the join column to the original from the hidden
				this.relatedModelDef.columns[this.relationDef.relatedJoinColumn].editDisplayView = origEditDisplayView;
			},
			saveEmbeddedForms: function(parentModel) {
				for (var i in this.embeddedForms) {
					//find the related id
					var childForm = this.embeddedForms[i].$el;
					//set the value for the related model
					childForm.find('[name="' + this.relationDef.relatedJoinColumn + '"]').val(parentModel.get(this.relationDef.joinColumn));
					this.embeddedForms[i].save();
				}
			}
		}),
		modelEditHasManyDeleteInsertOrder: Backbone.View.extend({
			initialize: function() {
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.columnName = this.options.columnName;
				this.model = this.options.model;
				
				this.modelDef = this.scaffold.modelDefs[this.modelName];
				this.columnDef = this.modelDef.columns[this.columnName];
				this.relationDef = this.modelDef.relatedModels[this.columnDef.relatedModelKey];
				this.relatedModelName = this.relationDef.relatedModelName;
				this.relatedModelDef = this.scaffold.modelDefs[this.relatedModelName];
				
				this.embeddedForms = [];
				_.bindAll(this, "updateOrder");
			},
			events: {
				'click a.bbs-addRelated' : 'addRelated'
			},
			render: function() {
				//create a blank list
				this.$el.css('border', '1px solid black');
				this.$el.html('<label>' + this.columnDef.label + '</label>');
				this.$el.append('<br />click and drag the <span class="handle">:::</span> to order the list');
				this.$ul = $('<ul class="sortable"></ul>');
				this.$el.append(this.$ul);
				
				//get the query for the related columns
				var whereDef = {};
				whereDef[this.relationDef.relatedJoinColumn] = this.model.get(this.relationDef.joinColumn);
				var relatedModels = this.relatedModelDef.backboneCollection.where(whereDef);
				
				//loop through each related model and add a list item to the view
				for (var i in relatedModels) {
					var modelToStringView = new this.scaffold.views.modelToStringWithDeleteOrder({
						tagName: 'li',
						scaffold: this.scaffold,
						modelName: this.relatedModelName,
						model: relatedModels[i]
					});
					this.$ul.append(modelToStringView.render().$el);
				}
				
				this.$ul.sortable();
				var orderCallback = this.updateOrder;
				this.$ul.sortable().bind('sortupdate', this.updateOrder);
				var template = _.template(this.scaffold.templates.modelEditAddRelated);
				this.$el.append(template({type:  this.columnDef.label }));
				return this;
			},
			updateOrder: function() {
				var orderView = this;
				this.$ul.find("li").each(function(){
					
					//get the id of related model from the attribute
					var relatedId = $(this).find('span').attr('data-bbs-modelId');
					console.log(relatedId);
					console.log(orderView.relatedModelDef.backboneCollection);
					var relatedModel = orderView.relatedModelDef.backboneCollection.get(relatedId);
					
					relatedModel.save({item_order: $(this).index()+1});
				});
			},
			addRelated: function(ev) {
				console.log(ev.currentTarget);
				var newModel = new this.relatedModelDef.backboneModel();
				newModel.set(this.relationDef.relatedJoinColumn, this.model.get(this.relationDef.joinColumn));
				
				//hide the related item but save original display form to restore after initializing the view
				var origEditDisplayView = this.relatedModelDef.columns[this.relationDef.relatedJoinColumn].editDisplayView;
				this.relatedModelDef.columns[this.relationDef.relatedJoinColumn].editDisplayView = 'modelEditColumnHidden';
				
				//set the related column in the other model to hidden since we are joining on it
				this.relatedModelDef.columns[this.relationDef.relatedJoinColumn].editDisplayType = 'hidden';
				var view = new this.scaffold.views.modelEdit({
					model: newModel,
					modelDef: this.relatedModelDef,
					modelName: this.relatedModelName,
					scaffold: this.scaffold,
					isEmbeddedForm: true
				})
				this.$ul.append(view.render().$el);

				this.embeddedForms.push(view);
				
				//turn back the join column to the original from the hidden
				this.relatedModelDef.columns[this.relationDef.relatedJoinColumn].editDisplayView = origEditDisplayView;
			},
			saveEmbeddedForms: function(parentModel) {
				for (var i in this.embeddedForms) {
					//find the related id
					var childForm = this.embeddedForms[i].$el;
					//set the value for the related model
					childForm.find('[name="' + this.relationDef.relatedJoinColumn + '"]').val(parentModel.get(this.relationDef.joinColumn));
					this.embeddedForms[i].save();
				}
			}
		}),
		//------------------------------------------------//
		//------------Model table column Views------------//
		//------------------------------------------------//
		modelColumnValue:  Backbone.View.extend({
			initialize: function() {
				//set up local variable from those passed in on creation of new object
				this.scaffold = this.options.scaffold;
				this.model = this.options.model;
				this.columnName = this.options.columnName;
				
				this.model.on('change', this.render, this);
			},
			render: function() {
				//create a blank list
				this.$el.html(this.model.get(this.columnName));
				
				return this;
			}
		}),
		//view to display a particular model column value
		modelColumnCollectionHasMany:  Backbone.View.extend({
			initialize: function() {
				//set up local variable from those passed in on creation of new object
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.columnName = this.options.columnName;
				this.model = this.options.model;
				
				//set up some more local variables based on the ones passed int
				this.modelDef = this.scaffold.modelDefs[this.modelName];
				this.columnDef = this.modelDef.columns[this.columnName];
				this.relatedModelDef = this.scaffold.modelDefs[this.columnDef.relatedModelName];
				this.relationDef = this.modelDef.relatedModels[this.columnDef.relatedModelName];
				
				//rerender when any item is added to the related collection
				this.relatedModelDef.backboneCollection.on('add', this.render, this);
			},
			render: function() {
				//create a blank list
				this.$el.html('');
				var $ul = $('<ul></ul>');
				this.$el.append($ul);
				
				//get the query for the related columns
				var whereDef = {};
				whereDef[this.relationDef.relatedJoinColumn] = this.model.get(this.relationDef.joinColumn);
				var relatedModels = this.relatedModelDef.backboneCollection.where(whereDef);
				
				//loop through each related model and add a list item to the view
				for (var i in relatedModels) {
					var modelToStringView = new this.scaffold.views.modelToString({
						tagName: 'li',
						scaffold: this.scaffold,
						modelName: this.columnDef.relatedModelName,
						model: relatedModels[i]
					});
					$ul.append(modelToStringView.render().$el);
				}
				
				return this;
			}
		}),
		//this view simply return the modelToString value 
		modelToString: Backbone.View.extend({
			initialize: function() {
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.model = this.options.model;
				
				this.model.on('change', this.render, this);
				this.model.on('destroy', this.remove, this); 
			},
			render: function () {
				var toStringValue = this.scaffold.modelDefs[this.modelName].modelToString(this.model, this.modelName, this.scaffold);
				this.$el.html(toStringValue);
				return this;
			}
		}),
		//this view simply return the modelToString value with a delete button to delete it
		modelToStringWithDelete: Backbone.View.extend({
			initialize: function() {
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.model = this.options.model;
				
				this.model.on('change', this.render, this);
				this.model.on('destroy', this.remove, this); 
			},
			events: {
				'click a.bbs-delete' : 'delete'
			},
			render: function () {
				var toStringValue = this.scaffold.modelDefs[this.modelName].modelToString(this.model, this.modelName, this.scaffold);
				var template = _.template(this.scaffold.templates.modelEditRemoveRelated);
				this.$el.html(toStringValue + ' ' + template({relatedModelName: this.scaffold.modelDefs[this.modelName].label}));
				return this;
			},
			delete: function() {
				this.scaffold.debugLog('deleting ' + this.modelName);
				this.model.destroy({wait: true, error: function(response) {alert('There was an error deleting the record');}});
			}
		}),
		//this view simply return the modelToString value with a delete button to delete it
		modelToStringWithDeleteOrder: Backbone.View.extend({
			initialize: function() {
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.model = this.options.model;
				
				this.model.on('change', this.render, this);
				this.model.on('destroy', this.remove, this); 
			},
			events: {
				'click a.bbs-delete' : 'delete'
			},
			render: function () {
				var handleTemplate = _.template(this.scaffold.templates.sortableHandle);
				var toStringValue = this.scaffold.modelDefs[this.modelName].modelToString(this.model, this.modelName, this.scaffold);
				var template = _.template(this.scaffold.templates.modelEditRemoveRelated);
				this.$el.html(
						handleTemplate({modelId: this.model.get('id')})
						+ toStringValue + ' '
						+ template({relatedModelName: this.scaffold.modelDefs[this.modelName].label})
				);
				return this;
			},
			delete: function() {
				this.scaffold.debugLog('deleting ' + this.modelName);
				this.model.destroy({wait: true, error: function(response) {alert('There was an error deleting the record');}});
			}
		}),
		modelColumnLookup: Backbone.View.extend({
			initialize: function() {
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.columnName = this.options.columnName;
				this.model = this.options.model;
				
				//get some helper attributes
				this.modelDef = this.scaffold.modelDefs[this.modelName];
				this.columnDef = this.modelDef.columns[this.columnName];
				this.relatedModelDef = this.scaffold.modelDefs[this.columnDef.relatedModelName];
				this.relatedCollection = this.relatedModelDef.backboneCollection;
		
				//if the related column is set then get the related model
				this.onChange();
				this.model.on('change', this.onChange, this);
			},
			render: function() {
				this.$el.html('');
				if(this.columnValue) {
					if(this.relatedModel != undefined) {
						var relatedModelToString = 
						this.$el.append(this.relatedModelDef.modelToString(
								this.relatedModel,
								this.relatedModelDef,
								this.scafold
						));
					}
				}
				return this;
			},
			onChange: function() {
				this.columnValue = this.model.get(this.columnName);
				//if the related column is set then get the related model
				if(this.columnValue) {
					this.relatedModel = this.relatedCollection.get(this.columnValue);
					if(this.relatedModel != undefined) {
						this.relatedModel.on('change', this.render, this);
					}
					
				}
				this.render();
			}
		}),
		
		//

		modelColumnManyToManyModelToString: Backbone.View.extend({
			initialize: function() {
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.columnName = this.options.columnName;
				this.model = this.options.model;
				
				//get some helper attributes
				this.modelDef = this.scaffold.modelDefs[this.modelName];
				this.columnDef = this.modelDef.columns[this.columnName];
				this.relationDef = this.modelDef.relatedModels[this.columnDef.relatedModelKey];
				this.relatedModelDef = this.scaffold.modelDefs[this.relationDef.relatedModelName];
				this.relatedCollection = this.relatedModelDef.backboneCollection;
				
				//get the table that is linked through the related model
				this.linkedRelationDef = this.relatedModelDef.relatedModels[this.columnDef.linkedModelKey];
				this.linkedModelDef = this.scaffold.modelDefs[this.linkedRelationDef.relatedModelName];
				this.linkedCollection = this.linkedModelDef.backboneCollection;
				
			},
			render: function() {
				var $ul = $('<ul></ul>');
				this.$el.html($ul);
				
				//loop through the related models and append li elements to the ul
				this.getLinkedModels();
				for(var modelIndex in this.linkedModels) {
					var relatedModelView = new this.scaffold.views.modelToString({
						tagName: 'li',
						scaffold: this.scaffold,
						modelName: this.linkedRelationDef.relatedModelName,
						model: this.linkedModels[modelIndex]
					});
					$ul.append(relatedModelView.render().$el);
				}
				return this;
			},
			getLinkedModels: function() {
				//get the related models
				var whereDef = {};
				whereDef[this.relationDef.relatedJoinColumn] = this.model.get(this.relationDef.joinColumn);
				
				var relatedModels = this.relatedCollection.where(whereDef);
				
				//loop through each related model and get the linked model
				this.linkedModels = [];
				for(var relatedModelKey in relatedModels) {
					whereDef = {};
					whereDef[this.linkedRelationDef.relatedJoinColumn] = relatedModels[relatedModelKey].get(this.linkedRelationDef.joinColumn); 
					this.linkedModels.push(this.linkedCollection.findWhere(whereDef));
				}
			}
		}),
		
		modelColumnHasManyModelToString: Backbone.View.extend({
			initialize: function() {
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.columnName = this.options.columnName;
				this.model = this.options.model;
				
				//get some helper attributes
				this.modelDef = this.scaffold.modelDefs[this.modelName];
				this.columnDef = this.modelDef.columns[this.columnName];
				this.relationDef = this.modelDef.relatedModels[this.columnDef.relatedModelKey];
				this.relatedModelDef = this.scaffold.modelDefs[this.relationDef.relatedModelName];
				this.relatedCollection = this.relatedModelDef.backboneCollection;
				
			},
			render: function() {
				var $ul = $('<ul></ul>');
				this.$el.html($ul);
				
				//loop through the related models and append li elements to the ul
				this.getRelatedModels();
				for(var modelIndex in this.relatedModels) {
					var relatedModelView = new this.scaffold.views.modelToString({
						tagName: 'li',
						scaffold: this.scaffold,
						modelName: this.relationDef.relatedModelName,
						model: this.relatedModels[modelIndex]
					});
					$ul.append(relatedModelView.render().$el);
				}
				return this;
			},
			getRelatedModels: function() {
				//get the related models
				var whereDef = {};
				whereDef[this.relationDef.relatedJoinColumn] = this.model.get(this.relationDef.joinColumn);
				
				this.relatedModels = this.relatedCollection.where(whereDef);
				
			}
		}),
	}
	BackboneScaffold.prototype.defaults.router = Backbone.Router.extend({
		routes: {
			'' : 'viewDefault',
			'model/:modelName': 'viewModel',
			'model/:modelName/insert': 'insertModel',
			'model/:modelName/edit/:id': 'editModel'
		},
		//the default view
		viewDefault: function() {
			this.scaffold.debugLog('defaultView');
		},
		viewModel: function(modelName) {
			this.scaffold.debugLog('viewModel:' + modelName);
			this.scaffold.displayModel(modelName);
		},
		insertModel: function(modelName) {
			this.scaffold.debugLog("routing insert " + modelName);
			
			//prepare callback with model name saved
			var reInsertModel = function(scaffold, modelName) {
				return function() {
					scaffold.router.insertModel(modelName);
				}
			}
			
			//check to see if the edit div is already initiated
			if(this.scaffold.modelDefs[modelName].displayInitializationStatus == 'not initialized') {
				this.scaffold.displayModel(modelName);
				setTimeout(reInsertModel(this.scaffold, modelName), 250);
				return false;
			}
			if(this.scaffold.modelDefs[modelName].displayInitializationStatus == 'initializing') {
				setTimeout(reInsertModel(this.scaffold, modelName), 250);
				return false;
			}

			var $edit = this.scaffold.elementGetters.modelEdit(this.scaffold.$scaffold, modelName);
			
			var view = new this.scaffold.views.modelEdit({
				el: $edit,
				scaffold: this.scaffold,
				modelName: modelName,
				modelDef: this.scaffold.modelDefs[modelName],
				model: new this.scaffold.modelDefs[modelName].backboneModel()
			});

			$edit.siblings().hide();
			$edit.show();
		},
		editModel: function(modelName, id) {
			this.scaffold.debugLog("routing insert " + modelName);
			
			//prepare callback with model name saved
			var reEditModel = function(scaffold, modelName, id) {
				return function() {
					scaffold.router.editModel(modelName, id);
				}
			}
			
			//check to see if the edit div is already initiated
			if(this.scaffold.modelDefs[modelName].displayInitializationStatus == 'not initialized') {
				this.scaffold.displayModel(modelName);
				setTimeout(reEditModel(this.scaffold, modelName, id), 250);
				return false;
			}
			if(this.scaffold.modelDefs[modelName].displayInitializationStatus == 'initializing') {
				setTimeout(reEditModel(this.scaffold, modelName, id), 250);
				return false;
			}
			
			var $edit = this.scaffold.elementGetters.modelEdit(this.scaffold.$scaffold, modelName);
			
			var view = new this.scaffold.views.modelEdit({
				el: $edit,
				scaffold: this.scaffold,
				modelName: modelName,
				modelDef: this.scaffold.modelDefs[modelName],
				model: this.scaffold.modelDefs[modelName].backboneCollection.get(id)
			});
			
			$edit.siblings().hide();
			$edit.show();
		}
			
	});
	
})();
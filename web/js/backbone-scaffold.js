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
	var $, _, Backbone;
	
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
		menu.append(template({name: '', label: 'home'}));
		for(var modelName in this.modelDefs) {
			menu.append(template({name: modelName, label: this.modelDefs[modelName].label}));
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
		this.modelDefs[modelName].backboneCollection = new Collection();
		
		var fetchCollectionSuccess = function(scaffold, modelName) {
			return function(collection) {
				scaffold.debugLog(modelName + ' collection initialized');
				scaffold.modelDefs[modelName].collectionInitializationStatus = 'initialized';
				//create the model div
				
				var modelDivTemplate = _.template(scaffold.templates.model);
				scaffold.$scaffold.append(modelDivTemplate({name: modelName, label: scaffold.modelDefs[modelName].label}));
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
		collectionInitializationStatus: 'not initialized',
		displayInitializationStatus: 'not initialized'
	};
	
	BackboneScaffold.prototype.defaults.columnDef = {
		type: 'string',	   //type of variable string, primaryId, integer, decimal, date, file
		length: '',		   //maximum length of the string
		label: '',			//if not set defaults to column key
		listDisplayType: 'value', //none, value, rawValue, date, lookup
		editDisplayType: 'text',  //none, text, hidden, value, dropdown, autocomplete
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
						<% for(columnName in columns) { if (columns[columnName].listDisplayType != "none") {%> \
							<th><%- columns[columnName].label %></th> \
						<% }} %> \
						</thead><tbody></tbody></table>',
		modelListTableActions: '<td> \
				<button class="bbs-edit">edit</button> \
				<button class="bbs-delete" onclick="return confirm(\'Are you sure you want to delete this record?\')">delete</button> \
			</td>',
		modelListTableValue: '<td><%- value %></td>',
		modelListTableCollectionLookup: '<td> \
			<% if (value) { \
				var relatedModel = scaffold.modelDefs[colDef.relatedModelName].backboneCollection.get(value);  \
				print(scaffold.modelDefs[colDef.relatedModelName].modelToString(relatedModel, scaffold.modelDefs[colDef.relatedModelName])); \
			} %></td>',
		modelListTableCollectionHasMany: '<td><ul><% \
				for(var index in relatedModels) print("<li>" + relatedModelDef.modelToString(relatedModels[index], relatedModelDef, scaffold) + "</li>") \
			%></ul></td>',
		//edit templates
		modelEditText: '<div class="bbs-editColumn"> \
							<label><%- label %></label> \
							<div><input class="bbs-editInputText" name="<%= columnName %>" value="<%= value %>" /></div> \
						</div>',
		modelEditCollectionDropdown: '<div class="bbs-editColumn"> \
			<label><%- label %></label> \
			<div><select class="bbs-editInputSelect" name="<%= columnName %>" > \
				<% if(colDef.emptyOption != undefined) { %><option value=""><%- colDef.emptyOption %></option><% } %> \
				<% scaffold.modelDefs[colDef.relatedModelName].backboneCollection.each( function(model) { \
					print("<option value=\'" + model.get("id") + "\'"); \
					if(model.get("id") == value) print("selected=\'selected\'"); \
					print(">" + scaffold.modelDefs[colDef.relatedModelName].modelToString(model, scaffold.modelDefs[colDef.relatedModelName])); \
					print("</option>");\
				}) %> \
			</select></div> \
		</div>',
		modelEditCollectionAssociationMany: '<div class="bbs-editColumn"> \
			<label><%- label %></label> \
			<div><select class="bbs-editInputSelect" name="<%= columnName %>" > \
				<% if(colDef.emptyOption != undefined) { %><option value=""><%- colDef.emptyOption %></option><% } %> \
				<% scaffold.modelDefs[colDef.relatedModelName].backboneCollection.each( function(model) { \
					print("<option value=\'" + model.get("id") + "\'>" + colDef.relatedModelToString(model) + "</option>"); }) %> \
			</select></div> \
		</div>',
		modelEditHidden: '<input type="hidden" class="bbs-editInputHidden" name="<%= columnName %>" value="<%= value %>" />',
		modelEditActions: '<div class="bbs-editActions"> \
				<button class="bbs-save">save</button> \
				<button class="bbs-cancel"">cancel</button> \
			</div>',
		
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
					relatedCollection.on('add', this.addAll, this);
					relatedCollection.on('reset', this.addAll, this);
					relatedCollection.on('remove', this.addAll, this);
					relatedCollection.on('change', this.addAll, this);
				}
				
				//setup the table
				console.log('adding another table ###################')
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
				this.scaffold.router.navigate(this.modelName + '/insert', {trigger: true});
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
		}),
		
		modelTableRow: Backbone.View.extend({
			tagName: 'tr',
			initialize: function(){
				//set up local variable from those passed in on creation of new object
				this.scaffold = this.options.scaffold;
				this.modelName = this.options.modelName;
				this.modelDef = this.options.modelDef;
				
				this.model.on('change', this.render, this);
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
				
				//instantiate all of the column templates
				var cellTemplates = {
					'value': _.template(this.scaffold.templates.modelListTableValue),
					'collectionLookup': _.template(this.scaffold.templates.modelListTableCollectionLookup),
					'collectionHasMany': _.template(this.scaffold.templates.modelListTableCollectionHasMany),
					'none': _.template('')
				};
				
				//loop through all of the columns and append each
				var cols = this.modelDef.columns;
				for( var colName in cols) {
					var colDef = cols[colName];
					
					//get the template based upon the display type 
					var displayType = cols[colName].listDisplayType;
					
					//default to the text display type
					if (cellTemplates[displayType] == undefined) {
						displayType = 'value';
					}
					
					switch (displayType) {
						case 'collectionHasMany': 
							var relatedModelDef = this.scaffold.modelDefs[colDef.relatedModelName];
							var relationDef = this.modelDef.relatedModels[colDef.relatedModelName];
							var whereDef = {};
							whereDef[relationDef.relatedJoinColumn] = this.model.get(relationDef.joinColumn);
							var relatedModels = relatedModelDef.backboneCollection.where(whereDef);
							var templateParams = {
								relatedModelDef: relatedModelDef,
								relatedModels: relatedModels,
								scaffold: this.scaffold
							};
							break;
						case 'value':
						default: 
							var templateParams = {
								value: this.model.get(colName),
								colDef: colDef,
								scaffold: this.scaffold
							}
					}

					//run the template and append to the tr element
					this.$el.append(cellTemplates[displayType](templateParams));
				}
				
				return this;
			},
			edit: function () {
				console.log('editing');
				this.scaffold.router.navigate(this.modelName + '/edit/' + this.model.get('id'), {trigger: true});
			},
			delete: function() {
				this.scaffold.debugLog('deleting ' + this.modelName);
				this.model.destroy({wait: true, error: function(response) {alert('There was an error deleting the record');}});
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
				var editTemplates = {
					'text': _.template(this.scaffold.templates.modelEditText),
					'collectionDropdown': _.template(this.scaffold.templates.modelEditCollectionDropdown),
					'collectionAssociationMany': _.template(this.scaffold.templates.modelEditCollectionAssociationMany),
					'hidden': _.template(this.scaffold.templates.modelEditHidden),
					'none': _.template('')
				};
				var cols = this.modelDef.columns;
				var cols = this.modelDef.columns;
				for( var colName in cols) {
					//get the template based upon the display type 
					var displayType = cols[colName].editDisplayType;
					
					//default to the text display type
					if (editTemplates[displayType] == undefined && displayType != 'collectionEmbeddedForm') {
						displayType = 'text';
					}
					
					//make sure to initialize the other collection
					if (displayType == 'collectionDropdown') {
						var relatedModelName = cols[colName].relatedModelName;
						if(this.scaffold.modelDefs[relatedModelName].backboneCollection == undefined) {
							this.scaffold.initModel(relatedModelName);
						}
					}
					
					
					// this will create a whole new embedded form 
					if( displayType == 'collectionEmbeddedForm' ){
						
						//setup some useful handles
						var columnDef = cols[colName];
						var relationDef = this.modelDef.relatedModels[columnDef.relatedModelName];
						var relatedModelDef = this.scaffold.modelDefs[columnDef.relatedModelName];
						var origEditDisplayType = relatedModelDef.columns[relationDef.relatedJoinColumn].editDisplayType;

						//set the related column in the other model to hidden since we are joining on it
						relatedModelDef.columns[relationDef.relatedJoinColumn].editDisplayType = 'hidden';

						//create the new div
						var embeddedDiv = $('<div class="bbs-relatedModelEdit">' + columnDef.label + '</div>');
						this.$el.append(embeddedDiv);
						
						//search through the collection to see if the related model is already set
						var whereDef = {};
						whereDef[relationDef.relatedJoinColumn] = this.model.get(relationDef.joinColumn);
						var relatedModels = relatedModelDef.backboneCollection.where(whereDef);
						if(relatedModels.length > 0) {
							var relatedModel = relatedModels[0];
						}
						else {
							var relatedModel = new relatedModelDef.backboneModel();
							relatedModel.set(relationDef.relatedJoinColumn, this.model.get(relationDef.joinColumn));
						}
						
						//create the new embedded form and push on to the array of embedded forms
						this.embeddedForms.push(new this.scaffold.views.modelEdit({
							el: embeddedDiv,
							scaffold: this.scaffold,
							modelName: columnDef.relatedModelName,
							modelDef: relatedModelDef,
							model: relatedModel,
							isEmbeddedForm: true
						}));

						//set the model back to its original
						relatedModelDef.columns[relationDef.relatedJoinColumn].editDisplayType = origEditDisplayType;
					}
					
					//run the template and append to the tr element
					if (displayType != 'collectionEmbeddedForm') {
					$form.append(editTemplates[displayType]({
						label: cols[colName].label,
						value: this.model.get(colName),
						columnName: colName,
						colDef: cols[colName],
						scaffold: this.scaffold
					}));
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
				//save the embedded forms
				for(var key in this.embeddedForms) { 
					this.embeddedForms[key].$el.find("[name='item_id']").val(model.get('id'));
					this.embeddedForms[key].save();
				}
				this.$el.hide();
				this.undelegateEvents();
				this.collection.add(model);
				if(this.isEmbeddedForm == false) {
					this.scaffold.router.navigate(this.modelName, {trigger: true});
				}
			},
			cancel: function() {
				this.undelegateEvents();
				this.scaffold.router.navigate(this.modelName, {trigger: true});
			}
		}),
	}
	BackboneScaffold.prototype.defaults.router = Backbone.Router.extend({
		routes: {
			'' : 'viewDefault',
			':modelName': 'viewModel',
			':modelName/insert': 'insertModel',
			':modelName/edit/:id': 'editModel'
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
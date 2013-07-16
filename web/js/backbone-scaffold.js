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
    
	//options, $scaffold, models, templates
	
	BackboneScaffold.prototype.init = function(init) {
		//set the models
		this.models = init.models;
		
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
		//assign default values to the models
		for( var modelName in this.models) {
			var modelDefaults = {apiName: modelName, label: modelName.replace(new RegExp('_', 'g'), ' ')};
			_.defaults(this.models[modelName], modelDefaults);
			_.defaults(this.models[modelName], this.modelDef);
			
			//loop through each column and set defaults
			for( var columnName in this.models[modelName].columns) {
				var columnDefaults = {label: columnName.replace(new RegExp('_', 'g'), ' ')};
				_.defaults(this.models[modelName].columns[columnName], columnDefaults);
				_.defaults(this.models[modelName].columns[columnName], this.columnDef);
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
	 * Setup the full scaffolding for all the models passed in 
	 */
	BackboneScaffold.prototype.setupScaffold = function(jqContainerSelector) {
		this.debugLog('setup scaffold');
		
		//get the scaffold container element and append the template
		this.$scaffold = $(jqContainerSelector);
		var scaffoldTemplate = _.template(this.templates.scaffold);
		this.$scaffold.append(scaffoldTemplate());
		
		//initialize the models
		for( var i in this.options.modelInitOrder) {
			this.displayModel(this.options.modelInitOrder[i]);
		}
		
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
		for(var modelName in this.models) {
			menu.append(template({name: modelName, label: this.models[modelName].label}));
		}
	};
	
	/**
	 * Display the Model
	 */
	BackboneScaffold.prototype.displayModel = function(modelName) {
		this.debugLog('display model: ' + modelName);
		//search to see if the model already exists
		var $model = this.elementGetters.model(this.$scaffold, modelName);
		if($model.length == 0) {
			this.initModel(modelName);
			$model = this.elementGetters.model(this.$scaffold, modelName);
		}
		if(typeof this.models[modelName].backboneView == 'undefined') {
			this.models[modelName].backboneView = new this.views.modelView({
				el: ".bbs-model-" + modelName,
				modelDef: this.models[modelName],
				modelName: modelName,
				scaffold: this
			});
		}
		
		//get the list element
		var $list = this.elementGetters.modelList(this.$scaffold, modelName);
		
		//make sure that the list section is displayed
		$list.siblings().hide();
		$list.show();
		
		//hide all the other models
		this.$scaffold.find('.bbs-model').hide(100);
		
		//show this model
		$model.show(100);
	};
	
	/**
	 * Initialize the model
	 */
	BackboneScaffold.prototype.initModel = function(modelName) {
		this.debugLog('initializing model:' + modelName);
		
		var cols = this.models[modelName].columns
		var defaults = {};
		for(var colName in cols){
			if (cols[colName].defaultValue != undefined) {
				defaults[colName] = cols[colName].defaultValue;
			}
		}
		//initialize the Backbone Model Class
		this.models[modelName].backboneModel = Backbone.RelationalModel.extend({
			urlRoot: this.options.apiRoot + '/' + modelName,
			modelName: modelName,
			columns: this.models[modelName].columns,
			defaults: defaults
		});
		
		//initialize the Backbone Collection Class
		var Collection = Backbone.Collection.extend({
			model: this.models[modelName].backboneModel,
			url: this.options.apiRoot + '/' + modelName
		});
		
		//instantiate the Backbone Collection Class and add to our model
		this.models[modelName].backboneCollection = new Collection();
		
		//fetch the data
		this.models[modelName].backboneCollection.fetch();
		
		//create the model div
		var modelDivTemplate = _.template(this.templates.model);
		this.$scaffold.append(modelDivTemplate({name: modelName, label: this.models[modelName].label}));
		
	};
	
	/**
	 * Initialize the model table
	 */
	BackboneScaffold.prototype.initModelListTable = function(modelName) {
		this.debugLog('initialize model list:' + modelName);
		
		var $modelList = this.elementGetters.modelList(this.$scaffold, modelName);
		
		//create the table
		var template = _.template(this.templates.modelListTable);
		$modelList.append(template({columns: this.models[modelName].columns}));
		
		//create the view for each row
		
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
		toString: function(model, modelDef) {
			var string = '';
			for ( var column in modelDef.columns) {
				string = string + model[columnName] + ', '
			}
			string = string.substring(1,string.length -1);
		}
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
				var relatedModel = scaffold.models[colDef.relatedModelName].backboneCollection.get(value);  \
				print(colDef.relatedModelToString(relatedModel)); \
			} %></td>',
		//edit templates
		modelEditText: '<div class="bbs-editColumn"> \
							<label><%- label %></label> \
							<div><input class="bbs-editInputText" name="<%= columnName %>" value="<%= value %>" /></div> \
						</div>',
		modelEditCollectionDropdown: '<div class="bbs-editColumn"> \
			<label><%- label %></label> \
			<div><select class="bbs-editInputSelect" name="<%= columnName %>" > \
				<% if(colDef.emptyOption != undefined) { %><option value=""><%- colDef.emptyOption %></option><% } %> \
				<% scaffold.models[colDef.relatedModelName].backboneCollection.each( function(model) { \
					print("<option value=\'" + model.get("id") + "\'>" + colDef.relatedModelToString(model) + "</option>"); }) %> \
			</select></div> \
		</div>',
		modelEditCollectionAssociationMany: '<div class="bbs-editColumn"> \
			<label><%- label %></label> \
			<div><select class="bbs-editInputSelect" name="<%= columnName %>" > \
				<% if(colDef.emptyOption != undefined) { %><option value=""><%- colDef.emptyOption %></option><% } %> \
				<% scaffold.models[colDef.relatedModelName].backboneCollection.each( function(model) { \
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
				
				//setup the table
				var tableTemplate = _.template(this.scaffold.templates.modelListTable);
				this.$el.find('.bbs-modelList').append(tableTemplate({columns: this.modelDef.columns}));

				_.bindAll(this, "addNew");
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
					'none': _.template('')
				};
				
				//loop through all of the columns and append each
				var cols = this.modelDef.columns;
				for( var colName in cols) {
					//get the template based upon the display type 
					var displayType = cols[colName].listDisplayType;
					
					//default to the text display type
					if (cellTemplates[displayType] == undefined) {
						displayType = 'value';
					}
					

					//make sure to initialize the related collection
					if (displayType == 'collectionLookup') {
						var relatedModelName = cols[colName].relatedModelName;
						if(this.scaffold.models[relatedModelName].backboneCollection == undefined) {
							this.scaffold.initModel(relatedModelName);
						}
						this.scaffold.models[relatedModelName].backboneCollection.fetch();
					}
					
					//run the template and append to the tr element
					this.$el.append(cellTemplates[displayType]({
						value: this.model.get(colName),
						colDef: cols[colName],
						scaffold: this.scaffold
					}));
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
					if (editTemplates[displayType] == undefined) {
						displayType = 'text';
					}
					
					//make sure to initialize the other collection
					if (displayType == 'collectionDropdown') {
						var relatedModelName = cols[colName].relatedModelName;
						if(this.scaffold.models[relatedModelName].backboneCollection == undefined) {
							this.scaffold.initModel(relatedModelName);
						}
					}
					
					//run the template and append to the tr element
					$form.append(editTemplates[displayType]({
						label: cols[colName].label,
						value: this.model.get(colName),
						columnName: colName,
						colDef: cols[colName],
						scaffold: this.scaffold
					}));
				}
				
				//loop through related models
				for (var relatedModelName in this.modelDef.relatedModels) {
					
					//get useful handles
					var relatedModelDef = this.modelDef.relatedModels[relatedModelName];
					var relatedScaffoldDef = this.scaffold.models[relatedModelName];
					var origEditDisplayType = relatedScaffoldDef.columns[relatedModelDef.relatedJoinColumn].editDisplayType;
					
					//set the related column in the other model to hidden since we are joining on it
					relatedScaffoldDef.columns[relatedModelDef.relatedJoinColumn].editDisplayType = 'hidden';
					
					//create the new div
					var embeddedDiv = $('<div class="bbs-relatedModelEdit">' + relatedModelDef.label + '</div>');
					this.$el.append(embeddedDiv);
					
					//create the related model and set the related field
					var relatedModel = new relatedScaffoldDef.backboneModel();
					alert(this.model.get(relatedModel.joinColumn));
					relatedModel.set(relatedModel.relatedJoinColumn, this.model.get(relatedModel.joinColumn));
					
					this.embeddedForms.push(new this.scaffold.views.modelEdit({
						el: embeddedDiv,
						scaffold: this.scaffold,
						modelName: relatedModelName,
						modelDef: relatedScaffoldDef,
						model: relatedModel,
						isEmbeddedForm: true
					}));
					
					//set the model back to its original
					relatedScaffoldDef.columns[relatedModelDef.relatedJoinColumn].editDisplayType = origEditDisplayType;
				}
				
				if(this.isEmbeddedForm == false) {
					var editActionsTemplate = _.template(this.scaffold.templates.modelEditActions);
					this.$el.append(editActionsTemplate({modelName: this.modelName, modelDef: this.modelDef, scaffold: this.scaffold}));
				}
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
			
			//check to see if the edit div is already initiated
			var $edit = this.scaffold.elementGetters.modelEdit(this.scaffold.$scaffold, modelName);
			if($edit.length == 0) {
				this.scaffold.initModel(modelName);
				$edit = this.scaffold.elementGetters.modelEdit(this.scaffold.$scaffold, modelName);
			}
			
			var view = new this.scaffold.views.modelEdit({
				el: $edit,
				scaffold: this.scaffold,
				modelName: modelName,
				modelDef: this.scaffold.models[modelName],
				model: new this.scaffold.models[modelName].backboneModel()
			});
		},
		editModel: function(modelName, id) {
			this.scaffold.debugLog("routing edit " + modelName + id);
			//check to see if the edit div is already initiated
			var $edit = this.scaffold.elementGetters.modelEdit(this.scaffold.$scaffold, modelName);
			if($edit.length == 0) {
				this.scaffold.initModel(modelName);
				$edit = this.scaffold.elementGetters.modelEdit(this.scaffold.$scaffold, modelName);
			}
			
			var view = new this.scaffold.views.modelEdit({
				el: $edit,
				scaffold: this.scaffold,
				modelName: modelName,
				modelDef: this.scaffold.models[modelName],
				model: this.scaffold.models[modelName].backboneCollection.get(id)
			});
			
			$edit.siblings().hide();
			$edit.show();
		}
			
	});
	
})();
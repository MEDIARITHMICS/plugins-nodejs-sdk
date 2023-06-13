# Changelog

# 0.14.0 - 2023-06-13

- New subclasses for `AudienceFeedConnectorBasePlugin` and `BatchedAudienceFeedConnectorBasePlugin<T>`, related to batched content.
- Breaking changes in `UserSegmentUpdatePluginResponse`, when used with `UserSegmentUpdatePluginBatchDeliveryResponseData`.
  - To output `BATCH_DELIVERY`, implement `BatchedAudienceFeedConnectorBasePlugin` instead, that will force implementation of 
  ```    
  protected abstract onUserSegmentUpdate(request: UserSegmentUpdateRequest, instanceContext: AudienceFeedConnectorBaseInstanceContext): Promise<BatchedUserSegmentUpdatePluginResponse<T>>;
  ```
- Force not null content in `UserSegmentUpdatePluginDeliveryContent`
  - Don't output `UserSegmentUpdatePluginDeliveryContent` if content is empty.
- Update `BatchUpdatePluginResponse#status` to uppercase status, instead of lowercase.


# 0.13.0 - 2023-03-27

Breaking changes in UserSegmentUpdatePluginResponse:
- `grouping_key` is now mandatory for file and batch delivery responses
- `destination_token` is now mandatory for file delivery responses

# 0.12.0 - 2023-03-22

Several rules where added regarding linting and formatting. <br />
The use of tsconfig compilerOptions lib 2019 is to in consideration regarding node <12 based plugin. Check readme for more informations.

# 0.11.1 - 2023-03-22

- Make grouping_key available for FileDelivery and BatchDelivery

# 0.11.0 - 2023-02-23

Breaking changes in UserSegmentUpdatePluginResponse (UPDATE).

- update the Audience feed onUserSegmentUpdate method return type.
- Interface UserSegmentUpdatePluginResponse data optional element is now of type DeliveryType.
- DeliveryType takes a `T` type argument that is unknown by default:
  - If target is **FILE_DELIVERY** type of the returned data will be `string`;
  - If target is **BATCH_DELIVERY** type of the returned data will be `T`;
- batch_token no longer exists.
- binary_content no longer exists (if needed send binary in content).
- remove duplicate destination_token (filed is only used of **FILE_DELIVERY**).

# 0.10.0 - 2022-10-28

Breaking changes in UserSegmentUpdatePluginResponse.

- update the Audience feed onUserSegmentUpdate method return type. Interface UserSegmentUpdatePluginResponse data optional element is now of type DeliveryType.
- status can be 'no_eligible_identifier' now (status code 400);
- stats field is changed (UserSegmentUpdatePluginResponseStats);
- in stats, identifier and sync_result become compulsory;
- SyncResult can now have only 3 values (PROCESSED, SUCCESS and REJECTED) in stats;
- tags in stats is now an optional list of tags;

# 0.9.10 - 2022-10-07

- fix visibility case (the release 0.9.9 missed a commit)

# 0.9.9 - 2022-10-07

- Add new parameter visibility on ExternalSegmentCreationPluginResponse (`PUBLIC` to show the message on navigator, `PRIVATE` to obfuscate it)
- Improve audience segment feed types (`sync_result`, `retry` status)

# 0.9.8 - 2022-07-28

- Add additional keys to CustomActionRequest interface (datamart_id, node_id, scenario_id)

# 0.9.7 - 2022-05-31

- Fix missing `type` in user identifier info

# 0.9.6 - 2022-05-31

- Add `USER_DEVICE_POINT` to `UserIdentifierInfoType`

# 0.9.5 - 2022-05-04

- Update StatsClient: to use development or production env / to correctly target metrics in Map

# 0.9.4 - 2022-04-22

- Fix StatsClient in tests

# 0.9.3 - 2022-03-22

- Move test helper dependencies

# 0.9.2 - 2022-03-16

- Enable to return retry statusName (429 Status Code) for the onUserSegmentUpdate method for the Audience Feed Connector Plugin
- Add a StatsClient using StatsD.

# 0.9.1 - 2022-01-14

- Fix packaging issue (size)

# 0.9.0 - 2022-01-14

- Added email renderer example.
- Simplify the init workflow as credentials are now pushed via the environment. This is a breaking change for tests, see the README file.

# 0.8.4 - 2021-04-13

- CustomActionBasePlugin fetch CustomAction and properties for InstanceContext.

# 0.8.3 - 2021-04-08

- Plugins that enable throttling should treat technical routes normally when they're busy.

# 0.8.2 - 2021-03-25

- Improve InstanceContext caching, don't cache failed promise.

# 0.8.1 - 2021-01-25

- Fix CustomActionBasePlugin, `instanceContextBuilder` does not fetch plugin properties as it needs a mics API token. Now to retrieve the CustomAction plugin and properties a token is needed, see functions `fetchCustomAction` and `fetchCustomActionProperties`.

# 0.8.0 - 2020-12-08

- Change CustomActionRequest for a custom action (instance_id to custom_action_id)

# 0.7.13 - 2020-12-01

- Add support for Custom Action plugins
- Refuse to process calls before the initialization

# 0.7.12 - 2020-10-27

- Fix : properly pass data and stats object in the onUserSegmentUpdate response

# 0.7.11 - 2020-10-06

- Update interface for the expected output of the onUserSegmentUpdate which optional parameters.

# 0.7.10 - 2020-04-23

- Fix logs, enable the use of macros such as %j instead of using JSON.stringify()

# 0.7.9 - 2019-09-20

- Fix this.logger and /log_level routes that were broken since winston 3.x upgrade.

# 0.7.8 - 2019-07-29

- Expose new helper method `itFactory` used to test an Activity Analyzer plugin.

# 0.7.7 - 2019-04-05

- Fix handlebars dependency issue

# 0.7.6 - 2019-04-04

- Add variability in the instance context refresh interval to avoid 'burst' on the Gateway API
- Change the default refresh interval from 2 minutes to 10 minutes

# 0.7.5 - 2019-03-08

- Fix Handlebars typescript declaration conflicts

# 0.7.4 - 2018-11-13

- Fix undefined port proxy url

# 0.7.3 - 2018-11-09

- Remove stack trace from messages when returning an error in `AudienceFeedConnectorBasePlugin`
- Add proxy url configuration with environment variables, by default it use `http://plugin-gateway.platform:8081`

# 0.7.2 - 2018-10-17

- Fix a bug concerning Audience Feed support: we were improperly returning `statusCode: 200` even when the Plugin implementation was returning `status: error` in its response.

# 0.7.1 - 2018-10-04

- Support of new Plugin Properties types: `ASSET_FILE` & `ASSET_FOLDER`

# 0.7.0 - 2018-08-21

- Update compartment_id type from number to string
- Fix interface UserActivity.EmailHash

# 0.6.0 - 2018-07-19

- Rename the `recommenderProperties` field to `properties` for Recommender support
- Change the type of `properties` in the Instance Context of Audience Feed & Recommender from `PluginProperty[]` to `PropertiesWrapper`
- Replace `click_urls` field with `click_urls_info` in AdRendererRequest, which contains the property `redirect_count` in addition to `url` for each entry.

# 0.5.0 - 2018-07-03

- Change the Template design (for AdRenderer and EmailRenderer). See `README.md`
- Add the `forceReload=true` support for AdRenderer & EmailRenderer InstanceContext build to make sure the creative displayed on navigator is always up to date with the configuration of the plugin instance on mediarithmics platform
- Remove unused `instanceContext` property in `ActivityAnalyzerBasePlugin` & `AdRendererBasePlugin`

# 0.4.5 - 2018-06-21

- Fix Email Renderer bug (wrong Id to store the InstanceContext)

# 0.4.4 - 2018-06-20

- Support for EmailRenderer with Templating features
- New Handlebar templating engine that list the macros used in the template
- New Templating engine interface to implement if you want to let the Plugin Impl. have a look into the Templating macros
- New `BasePlugin` helpers:
  - `requestPublicMicsApiHelper()` to do API requests on the mediarithmics API
  - `fetchDatamarts()` to fetch the list of Datamarts inside an organisation
  - `fetchDatamartCompartments()` to fetch the list of Compartments inside a Datamart
- New types definition for `Datamart` and `Compartment`
- New `PropertyWrapper` method `findBooleanProperty()`

# 0.4.3 - 2018-06-08

- `requestGatewayHelper()` is now explicitely not using any proxy, even if one is configured in an environment variable (ex: `http_proxy` / `HTTP_PROXY` / `https_proxy` / `HTTPS_PROXY`)

# 0.4.2 - 2018-06-07

- Fix some typo in debug log text
- `requestGatewayHelper()` is now logging the basic auth user&password used to authenticate on the Gateway

# 0.4.1 - 2018-05-24

- Fix a regression on the property values (they can be null)
- Fix a crash with handlebars when the template is null

# 0.4.0 - 2018-05-03

- Muti process support (new parameter to pass to the ProductionPluginRunner), disabled by default
- Improve Audience External Feed support (`getInstanceContext` helper)
- Better support of types with Instance properties fetching
- Some naming changes (see the migration seciton in `README`)\

# 0.3.9 - 2018-04-05

- Add an option to return a 429 HTTP code when the plugin is too busy

# 0.3.8 - 2018-03-19

- Fix invalid characters issues in the DisplayContext header

# 0.3.7 - 2018-03-13

- Add `creative_variant` on the `BidOptimizerPluginResponse` interface
- Add `compartment_id` on the `UserAccountIdentifierInfo` interface

# 0.3.6 - 2018-03-05

- Add `blast_id` on the `EmailRoutingRequest` interface
- Add `creative_variant` on the `AdRendererRequest` interface

# 0.3.5 - 2018-01-11

- Fix Audience Feed support (wrong initial integration which was not aligned with the API)
- Add an Helper to do the Handlebars macros mapping for AdRenderer with Templating using the Handlebars Engine
- Update IAS TAG integration for AdRenderer using the Handlebars engine (escape the media_id as it's passed in an IAS URL)

# 0.3.4 - 2018-01-09

- Fix overiding request options parameters in requestGatewayHelper

# 0.3.3 - 2018-01-05

- Add support for Audience Feed Connectors plugins

# 0.3.2 - 2017-12-15

- Remove a console.log in the handlebars engine

# 0.3.1 - 2017-12-01

- Improve error handling with async/await
- Fix error message of gateway helper
- Fix the JSON vs non JSON situations
- Add async middleware to stop using try catch in routes
- Add async middleware to all plugin routes
- Remove legacy log
- Update IAS Tag integration

# 0.3.0 - 2017-11-15

- New "Templating" support with AdRendererTemplatePlugin class (for AdRenderer that don't need recommendations)

# 0.2.4 - 2017-10-25

- Add support for email router and email renderer
- Fix User Activity Interface
- Add a MailJet Email router as an implementation example

## 0.2.3 - 2017-09-15

- Updated the UserActivityEventProperty Interface
- Fix some Activity Analyzer tests

## 0.2.2 - 2017-09-14

- Fix user_agent_id interface
- Add testing of User Agent id (case: null & check if correctly passed to recommender)

## 0.2.1 - 2017-09-13

- Added support of the BidOptimizer plugins
- Fix PluginProperty interface
- Added a BidOptimizer example
- Removed package-lock.json from examples for SDK release testing purposes
- Added some Geolocation helpers

## 0.2.0 - 2017-09-11

- Breaking changes in the SDK public API > Now relying on Javascript ES6 Class APIs. Not compatible with the 0.1.x versions of the SDK
- New interfaces for UserActivity / Recommendations objects
- New Plugin type to implement Ad Renderer using Recommendations and Templating features
- Handlebars.js template engine integration
- Testing capbility of plugin built with this SDK. See the examples to see how it works.
- SDK Tests: The SDK itself is now tested, you can run the tests by typing `npm test`
- Doc generation: Use `npm doc` to generate the documentation (using typedoc)

## 0.1.2 - 2017-08-08

- Fix missing value in ValueInterface (=> url)
- Fix log level case issue
- Add fetchDataFile helper (which return binary)
- Add custom InstanceContext builder use in Activity Analyzer example
- Fix error catching issue
- Exposed ActivityAnalyzer & ActivityAnalyzerProperty interfaces

## 0.1.1 - 2017-08-01

- Include the `build/` directory in the published package

## 0.1.0 - 2017-08-01

- Initial release

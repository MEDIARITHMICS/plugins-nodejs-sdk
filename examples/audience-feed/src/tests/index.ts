import 'mocha';

import * as sinon from 'sinon';
import * as request from 'supertest';

import { core } from '@mediarithmics/plugins-nodejs-sdk';
import { BatchLine, ExampleAudienceFeed } from '../ExampleAudienceFeed';
import { expect } from 'chai';
import { UserIdentifierInfo } from '@mediarithmics/plugins-nodejs-sdk/lib/mediarithmics';

const PLUGIN_AUTHENTICATION_TOKEN = 'Manny';
const PLUGIN_WORKER_ID = 'Calavera';

// set by the plugin runner in production
process.env.PLUGIN_AUTHENTICATION_TOKEN = PLUGIN_AUTHENTICATION_TOKEN;
process.env.PLUGIN_WORKER_ID = PLUGIN_WORKER_ID;

describe.only('Test Audience Feed example', function () {
  this.timeout(10000);
  const plugin = new ExampleAudienceFeed();
  let runner: core.TestingPluginRunner;

  it('Check behaviour of audience feed', (done) => {
    const rpMockup: sinon.SinonStub = sinon.stub();

    rpMockup
      .withArgs(
        sinon.match.has(
          'uri',
          sinon.match(function (value: string) {
            return value.match(/\/v1\/audience_segment_external_feeds\/(.){1,10}/) !== null;
          }),
        ),
      )
      .returns({
        status: 'ok',
        data: {
          id: '11111',
          plugin_id: '22222',
          organisation_id: '33333',
          group_id: '44444',
          artifact_id: '55555',
          version_id: '66666',
          selected_identifying_resources: [],
        },
      });

    rpMockup
      .withArgs(
        sinon.match.has(
          'uri',
          sinon.match(function (value: string) {
            return RegExp(/\/v1\/audience_segment_external_feeds\/(.){1,10}\/properties/).exec(value) !== null;
          }),
        ),
      )
      .returns({
        count: 1,
        data: [
          {
            technical_name: 'name',
            value: {
              value: 'MyAudienceFeedName',
            },
            property_type: 'STRING',
            origin: 'PLUGIN',
            writable: true,
            deletable: false,
          },
        ],
        status: 'ok',
      });

    runner = new core.TestingPluginRunner(plugin, rpMockup);

    const datamart_id = '1';
    const segment_id = '100';
    const feed_id = '1000';

    request(runner.plugin.app)
      .post('/v1/external_segment_creation')
      .send({ datamart_id, segment_id, feed_id })
      .end((error, response) => {
        expect(response.status).to.eq(200);
        const body: core.ExternalSegmentCreationPluginResponse = JSON.parse(response.text);
        expect(body.message).to.eq('test_creation');
        expect(body.visibility).to.eq('PUBLIC');

        request(runner.plugin.app)
          .post('/v1/external_segment_connection')
          .send({ datamart_id, segment_id, feed_id })
          .end((error, response) => {
            expect(response.status).to.eq(200);
            const body: core.ExternalSegmentConnectionPluginResponse = JSON.parse(response.text);
            expect(body.message).to.eq('test_connection');

            const user_identifiers: UserIdentifierInfo[] = [
              {
                type: 'USER_POINT',
                creation_ts: 1717494873,
                user_point_id: 'c87ff324-150f-427d-882a-b1f24c801980',
              },
              {
                type: 'USER_POINT',
                creation_ts: 1717494873,
                user_point_id: '113d1008-41c9-47f0-99d5-de78a3beec59',
              },
            ];

            request(runner.plugin.app)
              .post('/v1/user_segment_update')
              .send({ datamart_id, segment_id, feed_id, user_identifiers })
              .end((error, response) => {
                expect(response.status).to.eq(200);
                const body: core.BatchedUserSegmentUpdatePluginResponse<BatchLine> = JSON.parse(response.text);
                expect(body.message).to.eq('test_update');
                expect(body.data.length).to.eq(2);
                expect(body.stats.length).to.eq(2);

                const batch_content = body.data.map((d) => d.content);

                request(runner.plugin.app)
                  .post('/v1/batch_update')
                  .send({ context: { datamart_id, segment_id, feed_id }, batch_content })
                  .end((error, response) => {
                    expect(response.status).to.eq(200);
                    const body: core.BatchUpdatePluginResponse = JSON.parse(response.text);
                    expect(body.message).to.eq('test_batch_update');
                    expect(body.stats[0].errors).to.eq(0);
                    expect(body.stats[0].successes).to.eq(2);
                    expect(body.stats[0].operation).to.eq('UPSERT');
                    done();
                  });
              });
          });
      });
  });

  it('Test troubleshoot action', (done) => {
    const rpMockup: sinon.SinonStub = sinon.stub();

    rpMockup
      .withArgs(
        sinon.match.has(
          'uri',
          sinon.match(function (value: string) {
            return value.match(/\/v1\/audience_segment_external_feeds\/(.){1,10}/) !== null;
          }),
        ),
      )
      .returns({
        status: 'ok',
        data: {
          id: '11111',
          plugin_id: '22222',
          organisation_id: '33333',
          group_id: '44444',
          artifact_id: '55555',
          version_id: '66666',
          selected_identifying_resources: [],
        },
      });

    rpMockup
      .withArgs(
        sinon.match.has(
          'uri',
          sinon.match(function (value: string) {
            return RegExp(/\/v1\/audience_segment_external_feeds\/(.){1,10}\/properties/).exec(value) !== null;
          }),
        ),
      )
      .returns({
        count: 1,
        data: [
          {
            technical_name: 'name',
            value: {
              value: 'MyAudienceFeedName',
            },
            property_type: 'STRING',
            origin: 'PLUGIN',
            writable: true,
            deletable: false,
          },
        ],
        status: 'ok',
      });

    runner = new core.TestingPluginRunner(plugin, rpMockup);

    const datamart_id = '1';
    const segment_id = '100';
    const feed_id = '1000';

    request(runner.plugin.app)
      .post('/v1/troubleshoot')
      .send({ datamart_id, segment_id, feed_id, action: 'FETCH_DESTINATION_AUDIENCE' })
      .end((error, response) => {
        const body: core.ExternalSegmentTroubleshootResponse = JSON.parse(response.text);
        expect(body.status).to.eq('ok');
        expect(body.data).to.deep.eq({ id: '1', name: 'myExternalAudience' });
        done();
      });
  });

  afterEach(() => {
    runner.plugin.pluginCache.clear();
  });
});

# Audience feed connector example

You will find in this directory an example of audience feed connector using `BatchedAudienceFeedConnectorBasePlugin`.
This example implements stats for `onUserSegmentUpdate` and `onBatchUpdate`, and implements `onTroubleshoot` to
fetch the destination audience.

## Naming conventions

- group_id: com.mediarithmics.audience.externalfeed
- artifact_id: audience-feed
- package.json -> name should be the artifact_id

For more details see [here](https://developer.mediarithmics.io/advanced-usages/audiences/audience-segment-feed)

## File delivery

You can use the file delivery feature only if you implements `AudienceFeedConnectorBasePlugin`.
So it is either batching or file delivery.

# 5-Minute Demo Flow

1. Farmer Upload
   - Use web dashboard (or mobile placeholder) to upload a herb with geo + photo.
   - Show returned JSON including `chain.txHash` placeholder and IPFS CIDs.
2. QR Generation
   - Click batch -> display QR code (points to trace endpoint).
3. Processing Update
   - Add processing event via dashboard (drying / packaging) and refresh trace list.
4. Ownership Transfer
   - Enter new owner address -> submit -> show updated chain object.
5. Consumer Verification
   - In mobile ConsumerScan screen, input batch ID to fetch condensed trace.
6. Map & Transparency
   - Highlight map marker for origin location and list of processing events.

Talking Points:
- Immutable anchor (blockchain tx hash or placeholder) + off-chain enrichments (Mongo/IPFS).
- Geo + photo + AI validation (placeholder) reduce fraud.
- Extensible for regulatory export compliance & farmer premium payments.
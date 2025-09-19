// Demo data population script for ayurvedic herbs
const demoHerbs = [
  {
    batchId: "TUR_2024_001",
    herbName: "Turmeric (Haldi)",
    farmerName: "Rajesh Kumar",
    farmLocation: "Sangli, Maharashtra",
    plantingDate: "2024-01-15",
    harvestDate: "2024-09-20",
    quantity: "150",
    unit: "kg",
    lat: "16.8524",
    lng: "74.5815",
    organicCertified: true,
    notes: "Premium quality turmeric with high curcumin content. Grown using traditional organic methods without chemical fertilizers."
  },
  {
    batchId: "ASH_2024_002",
    herbName: "Ashwagandha",
    farmerName: "Priya Sharma",
    farmLocation: "Neemuch, Madhya Pradesh",
    plantingDate: "2024-02-01",
    harvestDate: "2024-11-15",
    quantity: "75",
    unit: "kg",
    lat: "24.4739",
    lng: "74.8200",
    organicCertified: true,
    notes: "Winter cherry roots harvested after 9 months. High withanolide content verified through lab testing."
  },
  {
    batchId: "NEE_2024_003",
    herbName: "Neem",
    farmerName: "Suresh Patel",
    farmLocation: "Ahmedabad, Gujarat",
    plantingDate: "2023-06-10",
    harvestDate: "2024-08-30",
    quantity: "200",
    unit: "kg",
    lat: "23.0225",
    lng: "72.5714",
    organicCertified: false,
    notes: "Fresh neem leaves and bark collected. Known for natural antimicrobial properties. Regular quality checks maintained."
  },
  {
    batchId: "TUL_2024_004",
    herbName: "Holy Basil (Tulsi)",
    farmerName: "Meera Devi",
    farmLocation: "Vrindavan, Uttar Pradesh",
    plantingDate: "2024-03-20",
    harvestDate: "2024-10-05",
    quantity: "45",
    unit: "kg",
    lat: "27.5820",
    lng: "77.7064",
    organicCertified: true,
    notes: "Sacred tulsi leaves carefully hand-picked. Grown in temple premises using traditional methods with cow dung manure."
  },
  {
    batchId: "FEN_2024_005",
    herbName: "Fenugreek (Methi)",
    farmerName: "Vikram Singh",
    farmLocation: "Jodhpur, Rajasthan",
    plantingDate: "2023-11-01",
    harvestDate: "2024-04-15",
    quantity: "120",
    unit: "kg",
    lat: "26.2389",
    lng: "73.0243",
    organicCertified: true,
    notes: "Premium fenugreek seeds with excellent germination rate. Grown in arid climate for enhanced potency."
  },
  {
    batchId: "AML_2024_006",
    herbName: "Amla (Indian Gooseberry)",
    farmerName: "Lakshmi Naidu",
    farmLocation: "Chitradurga, Karnataka",
    plantingDate: "2022-07-01",
    harvestDate: "2024-12-10",
    quantity: "300",
    unit: "kg",
    lat: "14.2251",
    lng: "76.3983",
    organicCertified: true,
    notes: "Fresh amla fruits from 2-year-old trees. High vitamin C content. Processed within 24 hours of harvest."
  },
  {
    batchId: "BRA_2024_007",
    herbName: "Brahmi",
    farmerName: "Dr. Anand Joshi",
    farmLocation: "Pune, Maharashtra",
    plantingDate: "2024-04-01",
    harvestDate: "2024-11-30",
    quantity: "30",
    unit: "kg",
    lat: "18.5204",
    lng: "73.8567",
    organicCertified: true,
    notes: "Premium brahmi leaves for cognitive enhancement. Grown in controlled greenhouse environment with optimal humidity."
  },
  {
    batchId: "GIL_2024_008",
    herbName: "Giloy (Guduchi)",
    farmerName: "Ramesh Yadav",
    farmLocation: "Haridwar, Uttarakhand",
    plantingDate: "2023-03-15",
    harvestDate: "2024-09-10",
    quantity: "80",
    unit: "kg",
    lat: "29.9457",
    lng: "78.1642",
    organicCertified: true,
    notes: "Fresh giloy stems from mature vines. Known immunity booster. Harvested during optimal alkaloid concentration period."
  }
];

const processingEvents = [
  { actor: "Quality Inspector", data: "Initial quality check completed - Grade A" },
  { actor: "Processor", data: "Cleaned and sorted according to Ayurvedic standards" },
  { actor: "Drying Unit", data: "Sun-dried for 7 days maintaining optimal moisture levels" },
  { actor: "Packaging Unit", data: "Vacuum sealed in food-grade containers" },
  { actor: "Quality Control", data: "Final lab testing completed - All parameters within limits" },
  { actor: "Distributor", data: "Received shipment and verified quality certificates" },
  { actor: "Retailer", data: "Stock received and ready for consumer sale" }
];

const ownershipTransfers = [
  { to: "Regional Processor - Ayurved Manufacturing Ltd" },
  { to: "Distributor - Green Valley Herbs Pvt Ltd" },
  { to: "Retailer - Nature's Pharmacy Chain" }
];

async function populateDemoData() {
  const baseUrl = 'http://localhost:4000';
  
  console.log('🌿 Starting demo data population...');
  
  for (let i = 0; i < demoHerbs.length; i++) {
    const herb = demoHerbs[i];
    
    try {
      // Create herb batch
      console.log(`Creating batch: ${herb.batchId} - ${herb.herbName}`);
      const response = await fetch(`${baseUrl}/api/herbs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(herb)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create ${herb.batchId}`);
      }
      
      const result = await response.json();
      console.log(`✅ Created: ${herb.batchId}`);
      
      // Add some processing events (randomly 2-4 events per batch)
      const numEvents = Math.floor(Math.random() * 3) + 2;
      for (let j = 0; j < numEvents; j++) {
        const event = processingEvents[j];
        
        await fetch(`${baseUrl}/api/herbs/${herb.batchId}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
      }
      
      // Add ownership transfers (1-2 per batch)
      const numTransfers = Math.floor(Math.random() * 2) + 1;
      for (let k = 0; k < numTransfers; k++) {
        const transfer = ownershipTransfers[k];
        
        await fetch(`${baseUrl}/api/herbs/${herb.batchId}/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transfer)
        });
      }
      
      console.log(`📊 Added events and transfers for ${herb.batchId}`);
      
    } catch (error) {
      console.error(`❌ Error creating ${herb.batchId}:`, error.message);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('🎉 Demo data population completed!');
  console.log('📋 Created 8 comprehensive ayurvedic herb batches with:');
  console.log('   - Complete herb information');
  console.log('   - Geographic locations across India');
  console.log('   - Processing events and ownership transfers');
  console.log('   - QR codes for traceability');
}

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { demoHerbs, populateDemoData };
} else {
  window.demoHerbs = demoHerbs;
  window.populateDemoData = populateDemoData;
}
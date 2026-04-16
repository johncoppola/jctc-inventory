// ===== DATA STORE =====
const STORAGE_KEY = 'jctc_inventory_v1';
let DATA = loadData();

// ===== ONE-TIME IMPORT: BStock Lot MOR-6596653 =====
(function importLot2() {
  if (DATA.lots.find(l => l.id === 2)) return; // already imported
  const lot = {
    id: 2,
    date: '2026-04-13',
    auctionPrice: 500,
    shippingFees: 602.36,
    otherCosts: 0,
    totalCost: 1102.36,
    totalUnits: 12,
    costPerUnit: +(1102.36 / 12).toFixed(2),
    notes: 'BStock MOR-6596653 — 2 Pallets of Dining Furniture, Bedroom Furniture, Fireplaces & More'
  };
  DATA.lots.push(lot);

  const newItems = [
    { brand: 'Koda Ltd', model: 'Florence 5PC Dining Set', msrp: 849.99, category: 'Home & Kitchen', notes: 'Seller: Dining Furniture' },
    { brand: 'Universal Furniture Intl', model: 'Rose Queen Bed', msrp: 799.99, category: 'Home & Kitchen', notes: 'Seller: Bedroom Furniture' },
    { brand: 'PT Integra Indocabint Tbk', model: 'Carson 5PC Dining Set', msrp: 699.99, category: 'Home & Kitchen', notes: 'Seller: Dining Furniture' },
    { brand: 'Twin Star Intl', model: 'Eloise 74" Fireplace', msrp: 549.99, category: 'Home & Kitchen', notes: 'Seller: Fireplaces' },
    { brand: 'Twin Star Intl', model: 'Aurora 47" Sit Stand Desk', msrp: 299.99, category: 'Home & Kitchen', notes: 'Seller: Office Furniture' },
    { brand: 'Hollywood Bed and Spring', model: 'Enforce King Boxspring', msrp: 249.99, category: 'Home & Kitchen', notes: 'Seller: Bedroom Furniture' },
    { brand: 'Whalen Limited', model: 'Highland Gaslift Barstool', msrp: 149.99, category: 'Home & Kitchen', notes: 'Seller: Dining Furniture' },
    { brand: 'Whalen Limited', model: 'Fireplace Stove', msrp: 69.99, category: 'Home & Kitchen', notes: 'Seller: Fireplaces (unit 1 of 2)' },
    { brand: 'Whalen Limited', model: 'Fireplace Stove', msrp: 69.99, category: 'Home & Kitchen', notes: 'Seller: Fireplaces (unit 2 of 2)' },
    { brand: 'Hollywood Bed and Spring', model: 'Premium Universal Lev-R-Lock Bed Frame', msrp: 79.99, category: 'Home & Kitchen', notes: 'Seller: Bedroom Furniture' },
    { brand: 'Unilin Flooring NC', model: 'Tudor Multifunction', msrp: 34.99, category: 'Home & Kitchen', notes: 'Seller: Flooring (unit 1 of 2)' },
    { brand: 'Unilin Flooring NC', model: 'Tudor Multifunction', msrp: 34.99, category: 'Home & Kitchen', notes: 'Seller: Flooring (unit 2 of 2)' },
  ];

  newItems.forEach(item => {
    const full = {
      sku: DATA.nextSKU++,
      lotId: 2,
      category: item.category,
      brand: item.brand,
      model: item.model,
      msrp: item.msrp,
      powersOn: 'Not Tested (Sealed)',
      coreFunction: 'Not Tested (Sealed)',
      accessories: 'Yes',
      missingItems: '',
      cosmeticGrade: 'A',
      functionalGrade: 'A (Sealed)',
      listedCondition: '',
      listingStatus: 1,
      listingChannel: '',
      listPrice: 0,
      dateListed: '',
      salePrice: 0,
      dateSold: '',
      paymentMethod: '',
      platformFees: 0,
      shippingCost: 0,
      otherCosts: 0,
      notes: item.notes,
    };
    full.unitCost = lot.costPerUnit;
    full.tier = 'Tier 1';
    full.netProceeds = null;
    full.grossProfit = null;
    full.roi = null;
    DATA.items.push(full);
  });

  localStorage.setItem('jctc_inventory_v1', JSON.stringify(DATA));
})();
// ===== END IMPORT =====

// ===== ONE-TIME IMPORT: BStock Lot MOR-6581942 =====
(function importLot3() {
  if (DATA.lots.find(l => l.id === 3)) return; // already imported
  const lot = {
    id: 3,
    date: '2026-04-13',
    auctionPrice: 1810,
    shippingFees: 666.77,
    otherCosts: 0,
    totalCost: 2476.77,
    totalUnits: 160,
    costPerUnit: 15.48,
    notes: 'BStock MOR-6581942 — 2 Pallets of Small Kitchen Appliances, Cookware, Cutlery & More'
  };
  DATA.lots.push(lot);

  const newItems = [
    { brand: 'Lagom Kitchen Company', model: 'Our Place Cold Press', msrp: 169.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 1 of 12)' },
    { brand: 'Lagom Kitchen Company', model: 'Our Place Cold Press', msrp: 169.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 2 of 12)' },
    { brand: 'Lagom Kitchen Company', model: 'Our Place Cold Press', msrp: 169.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 3 of 12)' },
    { brand: 'Lagom Kitchen Company', model: 'Our Place Cold Press', msrp: 169.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 4 of 12)' },
    { brand: 'Lagom Kitchen Company', model: 'Our Place Cold Press', msrp: 169.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 5 of 12)' },
    { brand: 'Lagom Kitchen Company', model: 'Our Place Cold Press', msrp: 169.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 6 of 12)' },
    { brand: 'Lagom Kitchen Company', model: 'Our Place Cold Press', msrp: 169.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 7 of 12)' },
    { brand: 'Lagom Kitchen Company', model: 'Our Place Cold Press', msrp: 169.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 8 of 12)' },
    { brand: 'Lagom Kitchen Company', model: 'Our Place Cold Press', msrp: 169.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 9 of 12)' },
    { brand: 'Lagom Kitchen Company', model: 'Our Place Cold Press', msrp: 169.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 10 of 12)' },
    { brand: 'Lagom Kitchen Company', model: 'Our Place Cold Press', msrp: 169.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 11 of 12)' },
    { brand: 'Lagom Kitchen Company', model: 'Our Place Cold Press', msrp: 169.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 12 of 12)' },
    { brand: 'Bsh Home Appliances', model: 'Bosch Verocafe Full Auto', msrp: 1699.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'Bsh Home Appliances', model: 'Bosch 300 Series Fullauto', msrp: 799.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'Newell Brands Dist', model: 'Foodsaver Vac Seal VS2280', msrp: 129.99, category: 'Home & Kitchen', notes: 'Seller: Food Storage (unit 1 of 4)' },
    { brand: 'Newell Brands Dist', model: 'Foodsaver Vac Seal VS2280', msrp: 129.99, category: 'Home & Kitchen', notes: 'Seller: Food Storage (unit 2 of 4)' },
    { brand: 'Newell Brands Dist', model: 'Foodsaver Vac Seal VS2280', msrp: 129.99, category: 'Home & Kitchen', notes: 'Seller: Food Storage (unit 3 of 4)' },
    { brand: 'Newell Brands Dist', model: 'Foodsaver Vac Seal VS2280', msrp: 129.99, category: 'Home & Kitchen', notes: 'Seller: Food Storage (unit 4 of 4)' },
    { brand: 'Steelstone Group', model: 'Gourmia French Door', msrp: 159.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 1 of 3)' },
    { brand: 'Steelstone Group', model: 'Gourmia French Door', msrp: 159.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 2 of 3)' },
    { brand: 'Steelstone Group', model: 'Gourmia French Door', msrp: 159.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 3 of 3)' },
    { brand: 'Groupe Seb', model: 'T-fal Clipso 8QT', msrp: 99.99, category: 'Home & Kitchen', notes: 'Seller: Cookware (unit 1 of 4)' },
    { brand: 'Groupe Seb', model: 'T-fal Clipso 8QT', msrp: 99.99, category: 'Home & Kitchen', notes: 'Seller: Cookware (unit 2 of 4)' },
    { brand: 'Groupe Seb', model: 'T-fal Clipso 8QT', msrp: 99.99, category: 'Home & Kitchen', notes: 'Seller: Cookware (unit 3 of 4)' },
    { brand: 'Groupe Seb', model: 'T-fal Clipso 8QT', msrp: 99.99, category: 'Home & Kitchen', notes: 'Seller: Cookware (unit 4 of 4)' },
    { brand: 'Tiger Corporation', model: 'Tiger No Pfas Rice Cooker', msrp: 99.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 1 of 4)' },
    { brand: 'Tiger Corporation', model: 'Tiger No Pfas Rice Cooker', msrp: 99.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 2 of 4)' },
    { brand: 'Tiger Corporation', model: 'Tiger No Pfas Rice Cooker', msrp: 99.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 3 of 4)' },
    { brand: 'Tiger Corporation', model: 'Tiger No Pfas Rice Cooker', msrp: 99.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 4 of 4)' },
    { brand: 'New Star Food Service', model: 'Cangshan Olympus Black', msrp: 319.99, category: 'Home & Kitchen', notes: 'Seller: Cutlery' },
    { brand: 'The Cookware Company', model: 'Greenpan Reserve 10PC', msrp: 289.99, category: 'Home & Kitchen', notes: 'Seller: Cookware' },
    { brand: 'The Cookware Company', model: 'Greenpan Eras 11-PIECE', msrp: 249.99, category: 'Home & Kitchen', notes: 'Seller: Cookware' },
    { brand: 'IB Appliances US Holdings', model: 'Instant Pot 6QT Rio Elec', msrp: 79.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 1 of 3)' },
    { brand: 'IB Appliances US Holdings', model: 'Instant Pot 6QT Rio Elec', msrp: 79.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 2 of 3)' },
    { brand: 'IB Appliances US Holdings', model: 'Instant Pot 6QT Rio Elec', msrp: 79.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 3 of 3)' },
    { brand: 'Meyer Marketing', model: 'Circulon 13PC HA Cookware', msrp: 229.99, category: 'Home & Kitchen', notes: 'Seller: Cookware' },
    { brand: 'New Star Food Service', model: 'Cangshan L Series 17PC Bl', msrp: 229.99, category: 'Home & Kitchen', notes: 'Seller: Cutlery' },
    { brand: 'Boston Foundry', model: 'Ceramiclad 4PC Frying Pan', msrp: 229.99, category: 'Home & Kitchen', notes: 'Seller: Cookware' },
    { brand: 'Cangshan Cutlery Company', model: 'Cangshan Denali 17PC', msrp: 219.99, category: 'Home & Kitchen', notes: 'Seller: Cutlery' },
    { brand: 'Zwilling JA Henckels', model: 'Henckels Forged Triple', msrp: 109.99, category: 'Home & Kitchen', notes: 'Seller: Cutlery (unit 1 of 2)' },
    { brand: 'Zwilling JA Henckels', model: 'Henckels Forged Triple', msrp: 109.99, category: 'Home & Kitchen', notes: 'Seller: Cutlery (unit 2 of 2)' },
    { brand: 'The Clorox Sales', model: 'Brita Water Pitcher', msrp: 33.99, category: 'Home & Kitchen', notes: 'Seller: Water Filtration (unit 1 of 6)' },
    { brand: 'The Clorox Sales', model: 'Brita Water Pitcher', msrp: 33.99, category: 'Home & Kitchen', notes: 'Seller: Water Filtration (unit 2 of 6)' },
    { brand: 'The Clorox Sales', model: 'Brita Water Pitcher', msrp: 33.99, category: 'Home & Kitchen', notes: 'Seller: Water Filtration (unit 3 of 6)' },
    { brand: 'The Clorox Sales', model: 'Brita Water Pitcher', msrp: 33.99, category: 'Home & Kitchen', notes: 'Seller: Water Filtration (unit 4 of 6)' },
    { brand: 'The Clorox Sales', model: 'Brita Water Pitcher', msrp: 33.99, category: 'Home & Kitchen', notes: 'Seller: Water Filtration (unit 5 of 6)' },
    { brand: 'The Clorox Sales', model: 'Brita Water Pitcher', msrp: 33.99, category: 'Home & Kitchen', notes: 'Seller: Water Filtration (unit 6 of 6)' },
    { brand: 'Conair', model: 'Cuis 12C Elite Diecast', msrp: 199.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'Delonghi America', model: 'Braun Triforce', msrp: 199.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'Breville', model: 'Breville Essenza Mini', msrp: 189.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'IB Appliances US Holdings', model: 'Instant Pot Duo Crisp', msrp: 189.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'Conair', model: 'Cuisinart Grind And Brew', msrp: 169.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'Lifetime Brands', model: 'Taylor Waterproof Digital', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Kitchen Essentials (unit 1 of 10)' },
    { brand: 'Lifetime Brands', model: 'Taylor Waterproof Digital', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Kitchen Essentials (unit 2 of 10)' },
    { brand: 'Lifetime Brands', model: 'Taylor Waterproof Digital', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Kitchen Essentials (unit 3 of 10)' },
    { brand: 'Lifetime Brands', model: 'Taylor Waterproof Digital', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Kitchen Essentials (unit 4 of 10)' },
    { brand: 'Lifetime Brands', model: 'Taylor Waterproof Digital', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Kitchen Essentials (unit 5 of 10)' },
    { brand: 'Lifetime Brands', model: 'Taylor Waterproof Digital', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Kitchen Essentials (unit 6 of 10)' },
    { brand: 'Lifetime Brands', model: 'Taylor Waterproof Digital', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Kitchen Essentials (unit 7 of 10)' },
    { brand: 'Lifetime Brands', model: 'Taylor Waterproof Digital', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Kitchen Essentials (unit 8 of 10)' },
    { brand: 'Lifetime Brands', model: 'Taylor Waterproof Digital', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Kitchen Essentials (unit 9 of 10)' },
    { brand: 'Lifetime Brands', model: 'Taylor Waterproof Digital', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Kitchen Essentials (unit 10 of 10)' },
    { brand: 'The Cookware Company', model: 'Greenpan Reserve 5PC', msrp: 164.99, category: 'Home & Kitchen', notes: 'Seller: Cookware' },
    { brand: 'Lagom Kitchen Company', model: 'Our Place 8PC Ceramic Blu', msrp: 159.99, category: 'Home & Kitchen', notes: 'Seller: Cookware' },
    { brand: 'The Cookware Company', model: 'Ms Dutch Oven Brser Lgray', msrp: 149.99, category: 'Home & Kitchen', notes: 'Seller: Cookware' },
    { brand: 'Pandex Merchandise', model: 'Pandex Icon Glasses', msrp: 24.99, category: 'Home & Kitchen', notes: 'Seller: Drinkware (unit 1 of 6)' },
    { brand: 'Pandex Merchandise', model: 'Pandex Icon Glasses', msrp: 24.99, category: 'Home & Kitchen', notes: 'Seller: Drinkware (unit 2 of 6)' },
    { brand: 'Pandex Merchandise', model: 'Pandex Icon Glasses', msrp: 24.99, category: 'Home & Kitchen', notes: 'Seller: Drinkware (unit 3 of 6)' },
    { brand: 'Pandex Merchandise', model: 'Pandex Icon Glasses', msrp: 24.99, category: 'Home & Kitchen', notes: 'Seller: Drinkware (unit 4 of 6)' },
    { brand: 'Pandex Merchandise', model: 'Pandex Icon Glasses', msrp: 24.99, category: 'Home & Kitchen', notes: 'Seller: Drinkware (unit 5 of 6)' },
    { brand: 'Pandex Merchandise', model: 'Pandex Icon Glasses', msrp: 24.99, category: 'Home & Kitchen', notes: 'Seller: Drinkware (unit 6 of 6)' },
    { brand: 'Conair', model: 'Cuisinart 2 Slice Digital', msrp: 44.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 1 of 3)' },
    { brand: 'Conair', model: 'Cuisinart 2 Slice Digital', msrp: 44.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 2 of 3)' },
    { brand: 'Conair', model: 'Cuisinart 2 Slice Digital', msrp: 44.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 3 of 3)' },
    { brand: 'Lifetime Brands', model: 'Mikasa Ciara 40PC', msrp: 119.99, category: 'Home & Kitchen', notes: 'Seller: Dinnerware' },
    { brand: 'Groupe Seb', model: 'T-fal Ceramic Non Stick', msrp: 39.99, category: 'Home & Kitchen', notes: 'Seller: Cookware (unit 1 of 3)' },
    { brand: 'Groupe Seb', model: 'T-fal Ceramic Non Stick', msrp: 39.99, category: 'Home & Kitchen', notes: 'Seller: Cookware (unit 2 of 3)' },
    { brand: 'Groupe Seb', model: 'T-fal Ceramic Non Stick', msrp: 39.99, category: 'Home & Kitchen', notes: 'Seller: Cookware (unit 3 of 3)' },
    { brand: 'The Cookware Company', model: 'Greenpan The Big Fry 13.4', msrp: 29.99, category: 'Home & Kitchen', notes: 'Seller: Cookware (unit 1 of 4)' },
    { brand: 'The Cookware Company', model: 'Greenpan The Big Fry 13.4', msrp: 29.99, category: 'Home & Kitchen', notes: 'Seller: Cookware (unit 2 of 4)' },
    { brand: 'The Cookware Company', model: 'Greenpan The Big Fry 13.4', msrp: 29.99, category: 'Home & Kitchen', notes: 'Seller: Cookware (unit 3 of 4)' },
    { brand: 'The Cookware Company', model: 'Greenpan The Big Fry 13.4', msrp: 29.99, category: 'Home & Kitchen', notes: 'Seller: Cookware (unit 4 of 4)' },
    { brand: 'Pro Mart Industries', model: 'Smartdesign Sofa Arm Tray', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Serveware (unit 1 of 6)' },
    { brand: 'Pro Mart Industries', model: 'Smartdesign Sofa Arm Tray', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Serveware (unit 2 of 6)' },
    { brand: 'Pro Mart Industries', model: 'Smartdesign Sofa Arm Tray', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Serveware (unit 3 of 6)' },
    { brand: 'Pro Mart Industries', model: 'Smartdesign Sofa Arm Tray', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Serveware (unit 4 of 6)' },
    { brand: 'Pro Mart Industries', model: 'Smartdesign Sofa Arm Tray', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Serveware (unit 5 of 6)' },
    { brand: 'Pro Mart Industries', model: 'Smartdesign Sofa Arm Tray', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Serveware (unit 6 of 6)' },
    { brand: 'Simplehuman', model: 'Simplehuman Silver Soap', msrp: 99.99, category: 'Home & Kitchen', notes: 'Seller: Kitchen Essentials' },
    { brand: 'Newell Brands Dist', model: 'Foodsaver Vacuum Sealer', msrp: 99.99, category: 'Home & Kitchen', notes: 'Seller: Food Storage' },
    { brand: 'Storebound', model: 'Dash Disney Waffle Maker', msrp: 49.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 1 of 2)' },
    { brand: 'Storebound', model: 'Dash Disney Waffle Maker', msrp: 49.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 2 of 2)' },
    { brand: 'Sensio', model: 'Bella Slow Cooker Set', msrp: 49.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 1 of 2)' },
    { brand: 'Sensio', model: 'Bella Slow Cooker Set', msrp: 49.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 2 of 2)' },
    { brand: 'Conair', model: 'Cuisinart Brewcentral 14C', msrp: 49.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 1 of 2)' },
    { brand: 'Conair', model: 'Cuisinart Brewcentral 14C', msrp: 49.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 2 of 2)' },
    { brand: 'Conair', model: 'Cuis Immersion Blendr', msrp: 39.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 1 of 2)' },
    { brand: 'Conair', model: 'Cuis Immersion Blendr', msrp: 39.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 2 of 2)' },
    { brand: 'Conair', model: 'Cuisinart Immersion', msrp: 39.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 1 of 2)' },
    { brand: 'Conair', model: 'Cuisinart Immersion', msrp: 39.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances (unit 2 of 2)' },
    { brand: 'Foodware', model: 'Winco 8QT Folding Chafer', msrp: 38.99, category: 'Home & Kitchen', notes: 'Seller: Commercial Kitchen Items (unit 1 of 2)' },
    { brand: 'Foodware', model: 'Winco 8QT Folding Chafer', msrp: 38.99, category: 'Home & Kitchen', notes: 'Seller: Commercial Kitchen Items (unit 2 of 2)' },
    { brand: 'Helen OF Troy', model: 'Oxo 4PC Pop Container', msrp: 37.99, category: 'Home & Kitchen', notes: 'Seller: Food Storage (unit 1 of 2)' },
    { brand: 'Helen OF Troy', model: 'Oxo 4PC Pop Container', msrp: 37.99, category: 'Home & Kitchen', notes: 'Seller: Food Storage (unit 2 of 2)' },
    { brand: 'Libbey Glass', model: 'Libbey Preston Flare 16PC', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Drinkware (unit 1 of 4)' },
    { brand: 'Libbey Glass', model: 'Libbey Preston Flare 16PC', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Drinkware (unit 2 of 4)' },
    { brand: 'Libbey Glass', model: 'Libbey Preston Flare 16PC', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Drinkware (unit 3 of 4)' },
    { brand: 'Libbey Glass', model: 'Libbey Preston Flare 16PC', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Drinkware (unit 4 of 4)' },
    { brand: 'Teakhaus', model: 'Teakhaus Cutting Board', msrp: 69.99, category: 'Home & Kitchen', notes: 'Seller: Food Prep' },
    { brand: 'Tramontina', model: 'Tramontina Cast Iron', msrp: 59.99, category: 'Home & Kitchen', notes: 'Seller: Cookware' },
    { brand: 'Tramontina', model: 'Tramontina 3PC SS Ceramic', msrp: 59.99, category: 'Home & Kitchen', notes: 'Seller: Cookware' },
    { brand: 'IB Appliances US Holdings', model: 'Instant Pot Slow Cooker', msrp: 59.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'Conair', model: 'Cuisinart Brewcentral 14C', msrp: 59.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'Steelstone Group', model: 'Gourmia 8QT Air Fryer', msrp: 59.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'Lifetime Brands', model: 'Faberware Salad Spinner', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Food Prep (unit 1 of 3)' },
    { brand: 'Lifetime Brands', model: 'Faberware Salad Spinner', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Food Prep (unit 2 of 3)' },
    { brand: 'Lifetime Brands', model: 'Faberware Salad Spinner', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Food Prep (unit 3 of 3)' },
    { brand: 'Meyer Corporation', model: 'Circulon 12" Deep Skillet', msrp: 49.99, category: 'Home & Kitchen', notes: 'Seller: Cookware' },
    { brand: 'Nordic Ware', model: 'Nordic Ware Naturals', msrp: 49.99, category: 'Home & Kitchen', notes: 'Seller: Bakeware' },
    { brand: 'Conair', model: 'Cuisinart Long Slot', msrp: 49.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'Sensio', model: 'Bella Xl Griddle', msrp: 49.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'Lifetime Brands', model: 'Mikasa Hammered Trays 2PC', msrp: 44.99, category: 'Home & Kitchen', notes: 'Seller: Serveware' },
    { brand: 'Miu', model: 'Miu Silicone Freezer Tray', msrp: 21.99, category: 'Home & Kitchen', notes: 'Seller: Food Storage (unit 1 of 2)' },
    { brand: 'Miu', model: 'Miu Silicone Freezer Tray', msrp: 21.99, category: 'Home & Kitchen', notes: 'Seller: Food Storage (unit 2 of 2)' },
    { brand: 'Seville Classics', model: 'Seville Expandable Org', msrp: 19.99, category: 'Home & Kitchen', notes: 'Seller: Storage/Laundry (unit 1 of 2)' },
    { brand: 'Seville Classics', model: 'Seville Expandable Org', msrp: 19.99, category: 'Home & Kitchen', notes: 'Seller: Storage/Laundry (unit 2 of 2)' },
    { brand: 'Lifetime Brands', model: 'Taylor Precision Digital', msrp: 19.99, category: 'Home & Kitchen', notes: 'Seller: Kitchen Essentials (unit 1 of 2)' },
    { brand: 'Lifetime Brands', model: 'Taylor Precision Digital', msrp: 19.99, category: 'Home & Kitchen', notes: 'Seller: Kitchen Essentials (unit 2 of 2)' },
    { brand: 'Lodge Manufacturing', model: 'Lodge 11" Skillet', msrp: 19.99, category: 'Home & Kitchen', notes: 'Seller: Cookware (unit 1 of 2)' },
    { brand: 'Lodge Manufacturing', model: 'Lodge 11" Skillet', msrp: 19.99, category: 'Home & Kitchen', notes: 'Seller: Cookware (unit 2 of 2)' },
    { brand: 'Lifetime Brands', model: 'Kitchenaid Colander', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Food Prep (unit 1 of 2)' },
    { brand: 'Lifetime Brands', model: 'Kitchenaid Colander', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Food Prep (unit 2 of 2)' },
    { brand: 'Lifetime Brands', model: 'Mikasa 20PC Flatware Set', msrp: 34.99, category: 'Home & Kitchen', notes: 'Seller: Flatware' },
    { brand: 'Miu', model: 'Miu 2-TIER Steamer Basket', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Food Prep (unit 1 of 2)' },
    { brand: 'Miu', model: 'Miu 2-TIER Steamer Basket', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Food Prep (unit 2 of 2)' },
    { brand: 'Storebound', model: 'Dash Popcorn Maker', msrp: 29.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'Safdie And Company', model: 'Safdie 10PC Ceramic', msrp: 29.99, category: 'Home & Kitchen', notes: 'Seller: Food Storage' },
    { brand: 'Party US Operations', model: 'Tupperware 2.1L Pitcher', msrp: 29.99, category: 'Home & Kitchen', notes: 'Seller: Drinkware' },
    { brand: 'Tabletops Unlimited', model: 'Denmark All Purpose Bowl', msrp: 12.99, category: 'Home & Kitchen', notes: 'Seller: Serveware (unit 1 of 2)' },
    { brand: 'Tabletops Unlimited', model: 'Denmark All Purpose Bowl', msrp: 12.99, category: 'Home & Kitchen', notes: 'Seller: Serveware (unit 2 of 2)' },
    { brand: 'Tramontina', model: 'Tramontina 12" Fry Pan', msrp: 24.99, category: 'Home & Kitchen', notes: 'Seller: Commercial Kitchen Items' },
    { brand: 'Hollywood Chairs', model: 'Destination Cutting Board', msrp: 24.99, category: 'Home & Kitchen', notes: 'Seller: Food Prep' },
    { brand: 'Miu', model: 'Miu 8PC SS Mixing Bowls', msrp: 24.99, category: 'Home & Kitchen', notes: 'Seller: Food Prep' },
    { brand: 'Bear Down Brands', model: 'Bentgo Glass Salad Box', msrp: 24.99, category: 'Home & Kitchen', notes: 'Seller: Food Storage' },
    { brand: 'Lifetime Brands', model: 'Kitchenaid Colander', msrp: 24.99, category: 'Home & Kitchen', notes: 'Seller: Food Prep' },
    { brand: 'Takeya Usa Corporation', model: 'Thermoflask SS 40OZ 2PK', msrp: 22.99, category: 'Home & Kitchen', notes: 'Seller: Drinkware' },
    { brand: 'Nordic Ware', model: 'Nordic Ware 3PC Baking S', msrp: 22.99, category: 'Home & Kitchen', notes: 'Seller: Bakeware' },
    { brand: 'Takeya Usa Corporation', model: 'Thermoflask Thermalcoffee', msrp: 21.99, category: 'Home & Kitchen', notes: 'Seller: Drinkware' },
    { brand: 'Eurow And O Reilly', model: 'Eur Bar-mop TOWEL-25PK', msrp: 19.99, category: 'Home & Kitchen', notes: 'Seller: Business Domestics' },
    { brand: 'Merchsource', model: 'Sharper Image Smores', msrp: 19.99, category: 'Home & Kitchen', notes: 'Seller: Small Kitchen Appliances' },
    { brand: 'Certified Intl', model: 'Certified 10PC Provence', msrp: 9.99, category: 'Home & Kitchen', notes: 'Seller: Serveware (unit 1 of 2)' },
    { brand: 'Certified Intl', model: 'Certified 10PC Provence', msrp: 9.99, category: 'Home & Kitchen', notes: 'Seller: Serveware (unit 2 of 2)' },
    { brand: 'Nordic Ware', model: 'Nordic Naturals 1/6 Sheet', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Bakeware' },
    { brand: 'Pro Mart Industries', model: 'Smartdesign Sofa Arm Tray', msrp: 18.99, category: 'Home & Kitchen', notes: 'Seller: Serveware' },
    { brand: 'Fortessa Tableware Soluti', model: 'Fortessa Jupiter Bowls', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Serveware' },
    { brand: 'Corelle Brands', model: 'Pyrex 8PC Mixed Colored', msrp: 16.99, category: 'Home & Kitchen', notes: 'Seller: Food Prep' },
    { brand: 'Ymf Carpets', model: 'Multi Purpose Kitchen Mat', msrp: 14.99, category: 'Home & Kitchen', notes: 'Seller: Linens' },
    { brand: 'Leapfrog Product Developm', model: 'Ello 14PC Reusable Food', msrp: 12.99, category: 'Home & Kitchen', notes: 'Seller: Food Storage' },
    { brand: 'Certified Intl', model: '10PC 4.75" Bowl Set', msrp: 9.99, category: 'Home & Kitchen', notes: 'Seller: Serveware' },
    { brand: 'Foodware', model: 'Winco Squeeze Bottles 6PK', msrp: 5.59, category: 'Home & Kitchen', notes: 'Seller: Commercial Kitchen Items' },
  ];

  newItems.forEach(item => {
    const full = {
      sku: DATA.nextSKU++,
      lotId: 3,
      category: item.category,
      brand: item.brand,
      model: item.model,
      msrp: item.msrp,
      powersOn: 'Not Tested (Sealed)',
      coreFunction: 'Not Tested (Sealed)',
      accessories: 'Yes',
      missingItems: '',
      cosmeticGrade: 'A',
      functionalGrade: 'A (Sealed)',
      listedCondition: '',
      listingStatus: 1,
      listingChannel: '',
      listPrice: 0,
      dateListed: '',
      salePrice: 0,
      dateSold: '',
      paymentMethod: '',
      platformFees: 0,
      shippingCost: 0,
      otherCosts: 0,
      notes: item.notes,
    };
    full.unitCost = lot.costPerUnit;
    full.tier = 'Tier 1';
    full.netProceeds = null;
    full.grossProfit = null;
    full.roi = null;
    DATA.items.push(full);
  });

  localStorage.setItem('jctc_inventory_v1', JSON.stringify(DATA));
})();
// ===== END IMPORT =====

function defaultData() {
  return { lots: [], items: [], nextSKU: 1 };
}

function loadData() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (d && d.lots && d.items) return d;
  } catch(e) {}
  return defaultData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA));
}

// ===== HELPERS =====
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function fmt(n) {
  if (n == null || isNaN(n)) return '-';
  return '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtPct(n) {
  if (n == null || isNaN(n)) return '-';
  return (Number(n) * 100).toFixed(1) + '%';
}

function calcTier(cosmetic, functional, powersOn, coreFunction) {
  if (powersOn === 'No' || coreFunction === 'No' || functional === 'C' || cosmetic === 'C') return 'Tier 3';
  if (cosmetic === 'B' || functional === 'B') return 'Tier 2';
  return 'Tier 1';
}

function calcItem(item) {
  const lot = DATA.lots.find(l => l.id == item.lotId);
  item.unitCost = lot ? lot.costPerUnit : 0;
  if (!item.tier) item.tier = calcTier(item.cosmeticGrade, item.functionalGrade, item.powersOn, item.coreFunction);
  const sale = Number(item.salePrice) || 0;
  const fees = Number(item.platformFees) || 0;
  const ship = Number(item.shippingCost) || 0;
  const other = Number(item.otherCosts) || 0;
  if (item.listingStatus == 5 && sale > 0) {
    item.netProceeds = sale - fees - ship - other;
    item.grossProfit = item.netProceeds - item.unitCost;
    item.roi = item.unitCost > 0 ? item.grossProfit / item.unitCost : 0;
  } else {
    item.netProceeds = null;
    item.grossProfit = null;
    item.roi = null;
  }
  return item;
}

function statusLabel(s) {
  const labels = {1:'Not Listed',2:'Listed',3:'Pending Sale',4:'Shipped',5:'Sold'};
  return labels[s] || 'Unknown';
}

function conditionOptions() {
  return ['','OB/LN','New - Open Box','Used - Like New','Used - Good','Used - Fair','Salvage/Parts'];
}
function channelOptions() {
  return ['','FBM','FBA','eBay','Mercari','OfferUp','Facebook','Craigslist','Direct','Other'];
}
function paymentOptions() {
  return ['','Cash','Venmo','CashApp','Zelle','PayPal','Credit Card','Cash & Venmo','Other'];
}

// ===== TABS =====
document.getElementById('tabs').addEventListener('click', e => {
  if (!e.target.classList.contains('tab')) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  e.target.classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  document.getElementById('view-' + e.target.dataset.tab).style.display = '';
  renderCurrentView();
});

function renderCurrentView() {
  const active = document.querySelector('.tab.active').dataset.tab;
  if (active === 'dashboard') renderDashboard();
  else if (active === 'all') renderAll();
  else if (active === 'open') renderOpen();
  else if (active === 'sold') renderSold();
  else if (active === 'lots') renderLots();
}

// ===== LOT MANAGEMENT =====
let editingLotId = null;

function showLotModal(lotId) {
  editingLotId = lotId || null;
  const m = document.getElementById('lotModal');
  document.getElementById('lotModalTitle').textContent = lotId ? 'Edit Lot' : 'Add New Lot';
  if (lotId) {
    const lot = DATA.lots.find(l => l.id == lotId);
    if (lot) {
      document.getElementById('lotId').value = lot.id;
      document.getElementById('lotDate').value = lot.date || '';
      document.getElementById('lotAuction').value = lot.auctionPrice;
      document.getElementById('lotShipping').value = lot.shippingFees;
      document.getElementById('lotOther').value = lot.otherCosts;
      document.getElementById('lotUnits').value = lot.totalUnits;
      document.getElementById('lotNotes').value = lot.notes || '';
      document.getElementById('lotId').disabled = true;
    }
  } else {
    document.getElementById('lotId').value = DATA.lots.length ? Math.max(...DATA.lots.map(l=>l.id)) + 1 : 1;
    document.getElementById('lotDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('lotAuction').value = '';
    document.getElementById('lotShipping').value = '0';
    document.getElementById('lotOther').value = '0';
    document.getElementById('lotUnits').value = '';
    document.getElementById('lotNotes').value = '';
    document.getElementById('lotId').disabled = false;
  }
  m.classList.add('show');
}

function closeLotModal() { document.getElementById('lotModal').classList.remove('show'); editingLotId = null; }

function saveLot() {
  const id = Number(document.getElementById('lotId').value);
  const auction = Number(document.getElementById('lotAuction').value) || 0;
  const shipping = Number(document.getElementById('lotShipping').value) || 0;
  const other = Number(document.getElementById('lotOther').value) || 0;
  const units = Number(document.getElementById('lotUnits').value) || 1;
  const total = auction + shipping + other;
  const lot = {
    id, date: document.getElementById('lotDate').value,
    auctionPrice: auction, shippingFees: shipping, otherCosts: other,
    totalCost: total, totalUnits: units, costPerUnit: total / units,
    notes: document.getElementById('lotNotes').value
  };
  if (editingLotId) {
    const idx = DATA.lots.findIndex(l => l.id == editingLotId);
    if (idx >= 0) DATA.lots[idx] = lot;
  } else {
    if (DATA.lots.find(l => l.id == id)) { alert('Lot ID already exists.'); return; }
    DATA.lots.push(lot);
  }
  // Recalc all items in this lot
  DATA.items.filter(i => i.lotId == id).forEach(i => calcItem(i));
  saveData();
  closeLotModal();
  updateLotFilters();
  renderCurrentView();
  toast(editingLotId ? 'Lot updated!' : 'Lot added!');
}

// ===== ITEM MANAGEMENT =====
function showItemModal() {
  if (!DATA.lots.length) { alert('Add a lot first before adding items.'); return; }
  const sel = document.getElementById('itemLot');
  sel.innerHTML = DATA.lots.map(l => `<option value="${l.id}">Lot ${l.id}</option>`).join('');
  ['itemBrand','itemModel','itemMissing','itemNotes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('itemMSRP').value = '';
  document.getElementById('itemPowers').value = 'Not Tested (Sealed)';
  document.getElementById('itemFunction').value = 'Not Tested (Sealed)';
  document.getElementById('itemAccessories').value = 'Yes';
  document.getElementById('itemCosmetic').value = 'A';
  document.getElementById('itemFunctional').value = 'A (Sealed)';
  document.getElementById('itemCategory').value = 'Electronics';
  document.getElementById('itemModal').classList.add('show');
}

function closeItemModal() { document.getElementById('itemModal').classList.remove('show'); }

function saveItem() {
  const item = {
    sku: DATA.nextSKU++,
    lotId: Number(document.getElementById('itemLot').value),
    category: document.getElementById('itemCategory').value,
    brand: document.getElementById('itemBrand').value,
    model: document.getElementById('itemModel').value,
    msrp: Number(document.getElementById('itemMSRP').value) || 0,
    powersOn: document.getElementById('itemPowers').value,
    coreFunction: document.getElementById('itemFunction').value,
    accessories: document.getElementById('itemAccessories').value,
    missingItems: document.getElementById('itemMissing').value,
    cosmeticGrade: document.getElementById('itemCosmetic').value,
    functionalGrade: document.getElementById('itemFunctional').value,
    listedCondition: '',
    listingStatus: 1,
    listingChannel: '',
    listPrice: 0,
    dateListed: '',
    salePrice: 0,
    dateSold: '',
    paymentMethod: '',
    platformFees: 0,
    shippingCost: 0,
    otherCosts: 0,
    notes: document.getElementById('itemNotes').value,
  };
  calcItem(item);
  DATA.items.push(item);
  saveData();
  closeItemModal();
  renderCurrentView();
  toast('Item added (SKU ' + item.sku + ')');
}

function deleteItem(sku) {
  if (!confirm('Delete SKU ' + sku + '? This cannot be undone.')) return;
  DATA.items = DATA.items.filter(i => i.sku !== sku);
  saveData();
  renderCurrentView();
  toast('Item deleted');
}

function updateField(sku, field, value) {
  const item = DATA.items.find(i => i.sku === sku);
  if (!item) return;
  if (['listPrice','salePrice','platformFees','shippingCost','otherCosts','msrp','listingStatus'].includes(field)) {
    item[field] = Number(value) || 0;
  } else {
    item[field] = value;
  }
  calcItem(item);
  saveData();
  // Re-render the calculated fields without full re-render
  const row = document.querySelector(`tr[data-sku="${sku}"]`);
  if (row) {
    const cells = row.querySelectorAll('.calc-cell');
    cells.forEach(c => {
      if (c.dataset.field === 'unitCost') c.textContent = fmt(item.unitCost);
      if (c.dataset.field === 'netProceeds') c.textContent = fmt(item.netProceeds);
      if (c.dataset.field === 'grossProfit') { c.textContent = fmt(item.grossProfit); c.className = 'calc-cell ' + (item.grossProfit >= 0 ? 'positive' : 'negative'); }
      if (c.dataset.field === 'roi') { c.textContent = fmtPct(item.roi); c.className = 'calc-cell ' + (item.roi >= 0 ? 'positive' : 'negative'); }
    });
  }
}

// ===== RENDER FUNCTIONS =====
function makeSelect(sku, field, options, current) {
  return `<select onchange="updateField(${sku},'${field}',this.value)">${options.map(o => {
    const val = typeof o === 'object' ? o.value : o;
    const label = typeof o === 'object' ? o.label : o;
    return `<option value="${val}" ${val == current ? 'selected' : ''}>${label}</option>`;
  }).join('')}</select>`;
}

function makeInput(sku, field, value, type='text') {
  const v = value == null || value === undefined ? '' : value;
  return `<input type="${type}" value="${v}" onchange="updateField(${sku},'${field}',this.value)" ${type==='number' ? 'step="0.01"' : ''}>`;
}

function itemRow(item, showAllCols=true) {
  const statusOpts = [{value:1,label:'Not Listed'},{value:2,label:'Listed'},{value:3,label:'Pending Sale'},{value:4,label:'Shipped'},{value:5,label:'Sold'}];
  let html = `<tr data-sku="${item.sku}">`;
  html += `<td>${item.sku}</td>`;
  html += `<td>Lot ${item.lotId}</td>`;
  html += `<td>${makeInput(item.sku,'brand',item.brand)}</td>`;
  html += `<td>${makeInput(item.sku,'model',item.model)}</td>`;
  html += `<td>${makeInput(item.sku,'category',item.category)}</td>`;
  html += `<td class="calc-cell" data-field="unitCost">${fmt(item.unitCost)}</td>`;
  if (showAllCols) {
    html += `<td>${makeSelect(item.sku,'powersOn',['Not Tested (Sealed)','Yes','No'],item.powersOn)}</td>`;
    html += `<td>${makeSelect(item.sku,'coreFunction',['Not Tested (Sealed)','Yes','No'],item.coreFunction)}</td>`;
    html += `<td>${makeSelect(item.sku,'accessories',['Yes','No','Partial'],item.accessories)}</td>`;
    html += `<td>${makeInput(item.sku,'missingItems',item.missingItems)}</td>`;
    html += `<td>${makeSelect(item.sku,'cosmeticGrade',['A','B','C'],item.cosmeticGrade)}</td>`;
    html += `<td>${makeSelect(item.sku,'functionalGrade',['A (Sealed)','A','B','C'],item.functionalGrade)}</td>`;
  }
  const tierClass = item.tier==='Tier 1'?'tier-select-1':item.tier==='Tier 2'?'tier-select-2':'tier-select-3';
  html += `<td><select class="${tierClass}" onchange="updateField(${item.sku},'tier',this.value);this.className='tier-select-'+(this.value==='Tier 1'?'1':this.value==='Tier 2'?'2':'3')">
    <option value="Tier 1" ${item.tier==='Tier 1'?'selected':''}>Tier 1</option>
    <option value="Tier 2" ${item.tier==='Tier 2'?'selected':''}>Tier 2</option>
    <option value="Tier 3" ${item.tier==='Tier 3'?'selected':''}>Tier 3</option>
  </select></td>`;
  html += `<td>${makeSelect(item.sku,'listedCondition',conditionOptions(),item.listedCondition)}</td>`;
  html += `<td>${makeSelect(item.sku,'listingStatus',statusOpts,item.listingStatus)}</td>`;
  html += `<td>${makeSelect(item.sku,'listingChannel',channelOptions(),item.listingChannel)}</td>`;
  html += `<td class="money-cell">$${makeInput(item.sku,'listPrice',item.listPrice||'','number')}</td>`;
  html += `<td>${makeInput(item.sku,'dateListed',item.dateListed,'date')}</td>`;
  html += `<td class="money-cell">$${makeInput(item.sku,'salePrice',item.salePrice||'','number')}</td>`;
  html += `<td>${makeInput(item.sku,'dateSold',item.dateSold,'date')}</td>`;
  html += `<td>${makeSelect(item.sku,'paymentMethod',paymentOptions(),item.paymentMethod)}</td>`;
  html += `<td class="money-cell">$${makeInput(item.sku,'platformFees',item.platformFees||'','number')}</td>`;
  html += `<td class="money-cell">$${makeInput(item.sku,'shippingCost',item.shippingCost||'','number')}</td>`;
  html += `<td class="money-cell">$${makeInput(item.sku,'otherCosts',item.otherCosts||'','number')}</td>`;
  html += `<td class="calc-cell" data-field="netProceeds">${fmt(item.netProceeds)}</td>`;
  html += `<td class="calc-cell ${item.grossProfit>=0?'positive':'negative'}" data-field="grossProfit">${fmt(item.grossProfit)}</td>`;
  html += `<td class="calc-cell ${item.roi>=0?'positive':'negative'}" data-field="roi">${fmtPct(item.roi)}</td>`;
  html += `<td class="money-cell">$${makeInput(item.sku,'msrp',item.msrp||'','number')}</td>`;
  html += `<td>${makeInput(item.sku,'notes',item.notes)}</td>`;
  html += `<td><button class="btn btn-danger btn-sm" onclick="deleteItem(${item.sku})">X</button></td>`;
  html += `</tr>`;
  return html;
}

// ===== SORTING STATE =====
let currentSortField = null;
let currentSortDir = 'asc'; // 'asc' or 'desc'

const HEADER_FIELD_MAP_ALL = [
  {label:'SKU',field:'sku'},{label:'Lot',field:'lotId'},{label:'Brand',field:'brand'},{label:'Model',field:'model'},
  {label:'Category',field:'category'},{label:'Unit Cost',field:'unitCost'},
  {label:'Powers On',field:'powersOn'},{label:'Core Fn',field:'coreFunction'},{label:'Accessories',field:'accessories'},
  {label:'Missing',field:'missingItems'},{label:'Cosmetic',field:'cosmeticGrade'},{label:'Functional',field:'functionalGrade'},
  {label:'Tier',field:'tier'},{label:'Condition',field:'listedCondition'},{label:'Status',field:'listingStatus'},
  {label:'Channel',field:'listingChannel'},{label:'List $',field:'listPrice'},{label:'Listed',field:'dateListed'},
  {label:'Sale $',field:'salePrice'},{label:'Sold',field:'dateSold'},{label:'Payment',field:'paymentMethod'},
  {label:'Fees',field:'platformFees'},{label:'Shipping',field:'shippingCost'},{label:'Other $',field:'otherCosts'},
  {label:'Net',field:'netProceeds'},{label:'Profit',field:'grossProfit'},{label:'ROI%',field:'roi'},
  {label:'MSRP',field:'msrp'},{label:'Notes',field:'notes'}
];
const HEADER_FIELD_MAP_SHORT = HEADER_FIELD_MAP_ALL.filter(h =>
  !['powersOn','coreFunction','accessories','missingItems','cosmeticGrade','functionalGrade'].includes(h.field)
);

function rth(col) {
  if (!col) return '<th></th>';
  const arrow = currentSortField === col.field
    ? (currentSortDir === 'asc' ? '\u25B2' : '\u25BC')
    : '\u25B2';
  const sortedClass = currentSortField === col.field ? ' sorted' : '';
  return `<th class="${sortedClass}" data-sort-field="${col.field}" onclick="toggleSort('${col.field}')">${col.label}<span class="sort-arrow">${arrow}</span><span class="col-resize"></span></th>`;
}

function tableHeaders(showAllCols=true) {
  const cols = showAllCols ? HEADER_FIELD_MAP_ALL : HEADER_FIELD_MAP_SHORT;
  let h = '<tr>' + cols.map(rth).join('');
  h += '<th></th></tr>';
  return h;
}

function toggleSort(field) {
  if (currentSortField === field) {
    currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortField = field;
    currentSortDir = 'asc';
  }
  reRenderCurrentView();
}

function sortItems(items) {
  if (!currentSortField) return items;
  const field = currentSortField;
  const dir = currentSortDir === 'asc' ? 1 : -1;
  return items.sort((a, b) => {
    let va = a[field], vb = b[field];
    if (va == null) va = '';
    if (vb == null) vb = '';
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
    va = String(va).toLowerCase();
    vb = String(vb).toLowerCase();
    return va.localeCompare(vb) * dir;
  });
}

function reRenderCurrentView() {
  const active = document.querySelector('.tab.active');
  if (!active) return;
  const tab = active.dataset.tab;
  if (tab === 'dashboard') renderDashboard();
  else if (tab === 'all') renderAll();
  else if (tab === 'open') renderOpen();
  else if (tab === 'sold') renderSold();
  else if (tab === 'lots') renderLots();
}

function filterItems(items, search, lotFilter) {
  if (lotFilter) items = items.filter(i => i.lotId == lotFilter);
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(i => (i.brand||'').toLowerCase().includes(s) || (i.model||'').toLowerCase().includes(s) || String(i.sku).includes(s));
  }
  return items;
}

function renderDashboard() {
  DATA.items.forEach(i => calcItem(i));
  const total = DATA.items.length;
  const sold = DATA.items.filter(i => i.listingStatus == 5);
  const open = DATA.items.filter(i => i.listingStatus != 5);
  const listed = DATA.items.filter(i => i.listingStatus == 2);
  const totalRevenue = sold.reduce((s,i) => s + (Number(i.salePrice)||0), 0);
  const totalCost = sold.reduce((s,i) => s + (i.unitCost||0), 0);
  const totalFees = sold.reduce((s,i) => s + (Number(i.platformFees)||0) + (Number(i.shippingCost)||0) + (Number(i.otherCosts)||0), 0);
  const netProfit = sold.reduce((s,i) => s + (i.grossProfit||0), 0);
  const avgRoi = sold.length ? sold.reduce((s,i) => s + (i.roi||0), 0) / sold.length : 0;
  const investedOpen = open.reduce((s,i) => s + (i.unitCost||0), 0);
  const listedValue = listed.reduce((s,i) => s + (Number(i.listPrice)||0), 0);

  document.getElementById('dashboardStats').innerHTML = `
    <div class="stat-card"><div class="label">Total Items</div><div class="value">${total}</div><div class="sub">${sold.length} sold / ${open.length} open</div></div>
    <div class="stat-card"><div class="label">Gross Revenue</div><div class="value">${fmt(totalRevenue)}</div><div class="sub">From ${sold.length} sales</div></div>
    <div class="stat-card"><div class="label">Net Profit</div><div class="value ${netProfit>=0?'positive':'negative'}">${fmt(netProfit)}</div><div class="sub">After ${fmt(totalFees)} in fees</div></div>
    <div class="stat-card"><div class="label">Avg ROI (Sold)</div><div class="value ${avgRoi>=0?'positive':'negative'}">${fmtPct(avgRoi)}</div><div class="sub">Per item average</div></div>
    <div class="stat-card"><div class="label">Open Inventory</div><div class="value">${open.length}</div><div class="sub">${fmt(investedOpen)} invested</div></div>
    <div class="stat-card"><div class="label">Listed Value</div><div class="value">${fmt(listedValue)}</div><div class="sub">${listed.length} items listed</div></div>
    <div class="stat-card"><div class="label">Total Lots</div><div class="value">${DATA.lots.length}</div><div class="sub">${fmt(DATA.lots.reduce((s,l)=>s+l.totalCost,0))} total invested</div></div>
    <div class="stat-card"><div class="label">Total COGS</div><div class="value">${fmt(totalCost)}</div><div class="sub">Cost of sold items</div></div>
  `;

  // Recent activity: last 10 items by date sold or date listed
  const recent = [...DATA.items].sort((a,b) => {
    const da = a.dateSold || a.dateListed || '';
    const db = b.dateSold || b.dateListed || '';
    return db.localeCompare(da);
  }).slice(0, 8);

  let rhtml = '<table>' + tableHeaders(false);
  recent.forEach(i => rhtml += itemRow(i, false));
  rhtml += '</table>';
  document.getElementById('recentTable').innerHTML = rhtml;
}

function renderAll() {
  DATA.items.forEach(i => calcItem(i));
  const search = document.getElementById('searchAll').value;
  const lot = document.getElementById('filterLot').value;
  const status = document.getElementById('filterStatus').value;
  const tier = document.getElementById('filterTier').value;
  let items = [...DATA.items];
  items = filterItems(items, search, lot);
  if (status) items = items.filter(i => i.listingStatus == status);
  if (tier) items = items.filter(i => i.tier === tier);
  items = sortItems(items);
  let html = '<table>' + tableHeaders(true);
  items.forEach(i => html += itemRow(i, true));
  if (!items.length) html += '<tr><td colspan="30" style="text-align:center;padding:24px;color:var(--text-dim)">No items found</td></tr>';
  html += '</table>';
  document.getElementById('allTable').innerHTML = html;
}

function renderOpen() {
  DATA.items.forEach(i => calcItem(i));
  const search = document.getElementById('searchOpen').value;
  const lot = document.getElementById('filterOpenLot').value;
  let items = DATA.items.filter(i => i.listingStatus != 5);
  items = filterItems(items, search, lot);
  items = sortItems(items);
  let html = '<table>' + tableHeaders(true);
  items.forEach(i => html += itemRow(i, true));
  if (!items.length) html += '<tr><td colspan="30" style="text-align:center;padding:24px;color:var(--text-dim)">All items sold! Nice work.</td></tr>';
  html += '</table>';
  document.getElementById('openTable').innerHTML = html;
}

function renderSold() {
  DATA.items.forEach(i => calcItem(i));
  const search = document.getElementById('searchSold').value;
  const lot = document.getElementById('filterSoldLot').value;
  let items = DATA.items.filter(i => i.listingStatus == 5);
  items = filterItems(items, search, lot);
  if (currentSortField) {
    items = sortItems(items);
  } else {
    items.sort((a,b) => (b.dateSold||'').localeCompare(a.dateSold||''));
  }
  let html = '<table>' + tableHeaders(true);
  items.forEach(i => html += itemRow(i, true));
  if (!items.length) html += '<tr><td colspan="30" style="text-align:center;padding:24px;color:var(--text-dim)">No sold items yet</td></tr>';
  html += '</table>';
  document.getElementById('soldTable').innerHTML = html;
}

function renderLots() {
  let html = '';
  DATA.lots.forEach(lot => {
    const items = DATA.items.filter(i => i.lotId == lot.id);
    const sold = items.filter(i => i.listingStatus == 5);
    const revenue = sold.reduce((s,i) => s + (Number(i.salePrice)||0), 0);
    const profit = sold.reduce((s,i) => s + (i.grossProfit||0), 0);
    html += `<div class="lot-card">
      <h3>Lot ${lot.id} <span style="font-size:12px;color:var(--text-dim)">${lot.date || ''}</span>
        <button class="btn btn-sm" onclick="showLotModal(${lot.id})">Edit</button>
      </h3>
      <div class="lot-stats">
        <div><span class="lot-stat-label">Auction:</span> ${fmt(lot.auctionPrice)}</div>
        <div><span class="lot-stat-label">Shipping/Fees:</span> ${fmt(lot.shippingFees)}</div>
        <div><span class="lot-stat-label">Other Costs:</span> ${fmt(lot.otherCosts)}</div>
        <div><span class="lot-stat-label">Total Cost:</span> <strong>${fmt(lot.totalCost)}</strong></div>
        <div><span class="lot-stat-label">Units:</span> ${lot.totalUnits}</div>
        <div><span class="lot-stat-label">Cost/Unit:</span> ${fmt(lot.costPerUnit)}</div>
        <div><span class="lot-stat-label">Items Tracked:</span> ${items.length}</div>
        <div><span class="lot-stat-label">Sold:</span> ${sold.length} / ${items.length}</div>
        <div><span class="lot-stat-label">Revenue:</span> ${fmt(revenue)}</div>
        <div><span class="lot-stat-label">Net Profit:</span> <span class="${profit>=0?'positive':'negative'}">${fmt(profit)}</span></div>
      </div>
      ${lot.notes ? `<div style="margin-top:8px;font-size:12px;color:var(--text-dim)">${lot.notes}</div>` : ''}
    </div>`;
  });
  if (!html) html = '<p style="color:var(--text-dim);padding:24px">No lots yet. Click "+ New Lot" to add one.</p>';
  document.getElementById('lotCards').innerHTML = '<div class="lot-cards">' + html + '</div>';
}

function updateLotFilters() {
  ['filterLot','filterOpenLot','filterSoldLot'].forEach(id => {
    const sel = document.getElementById(id);
    const val = sel.value;
    sel.innerHTML = '<option value="">All Lots</option>' + DATA.lots.map(l => `<option value="${l.id}">Lot ${l.id}</option>`).join('');
    sel.value = val;
  });
}

// ===== EXPORT / IMPORT =====
function exportData() {
  const blob = new Blob([JSON.stringify(DATA, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'jctc_inventory_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  toast('Data exported!');
}

function exportCSV() {
  DATA.items.forEach(i => calcItem(i));
  const headers = ['SKU','Lot','Brand','Model','Category','Unit Cost','Powers On','Core Function','Accessories','Missing Items','Cosmetic Grade','Functional Grade','Tier','Listed Condition','Status','Channel','List Price','Date Listed','Sale Price','Date Sold','Payment Method','Platform Fees','Shipping Cost','Other Costs','Net Proceeds','Gross Profit','ROI%','MSRP','Notes'];
  const rows = DATA.items.map(i => [
    i.sku,i.lotId,i.brand,i.model,i.category,i.unitCost,i.powersOn,i.coreFunction,i.accessories,i.missingItems,
    i.cosmeticGrade,i.functionalGrade,i.tier,i.listedCondition,statusLabel(i.listingStatus),i.listingChannel,
    i.listPrice,i.dateListed,i.salePrice,i.dateSold,i.paymentMethod,i.platformFees,i.shippingCost,i.otherCosts,
    i.netProceeds,i.grossProfit,i.roi,i.msrp,i.notes
  ].map(v => `"${(v==null?'':String(v)).replace(/"/g,'""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'jctc_inventory_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  toast('CSV exported!');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const d = JSON.parse(e.target.result);
      if (d.lots && d.items) {
        if (!confirm(`Import ${d.items.length} items and ${d.lots.length} lots? This will REPLACE all current data.`)) return;
        DATA = d;
        saveData();
        updateLotFilters();
        renderCurrentView();
        toast('Data imported successfully!');
      } else {
        alert('Invalid data file.');
      }
    } catch(err) { alert('Error reading file: ' + err.message); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ===== SEED LOT 1 DATA =====
function seedLot1() {
  if (DATA.lots.length > 0 || DATA.items.length > 0) return; // Don't re-seed

  DATA.lots.push({
    id: 1, date: '2026-01-07', auctionPrice: 1920.61, shippingFees: 313.03, otherCosts: 0,
    totalCost: 2233.64, totalUnits: 32, costPerUnit: 69.80125, notes: ''
  });

  const lot1Items = [
    {sku:32,brand:'Hisense',model:'AX700',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:110,dl:'2026-01-29',sp:100,ds:'2026-03-09',pay:'Venmo',fees:2,ship:0,oth:0,msrp:250,notes:''},
    {sku:31,brand:'Hisense',model:'AX700',cat:'Electronics',pow:'Yes',fn:'Yes',acc:'Yes',miss:'Box',cos:'B',func:'A',cond:'Used - Good',status:5,ch:'FBM',lp:150,dl:'2026-01-24',sp:125,ds:'2026-02-01',pay:'CashApp',fees:3.4,ship:0,oth:0,msrp:250,notes:''},
    {sku:2,brand:'KEF',model:'LSX II LT BOOKSHELF',cat:'Electronics',pow:'Yes',fn:'Yes',acc:'Yes',miss:'',cos:'B',func:'A',cond:'Used - Good',status:5,ch:'FBM',lp:325,dl:'2026-02-02',sp:325,ds:'2026-03-12',pay:'Venmo',fees:6.27,ship:0,oth:0,msrp:600,notes:''},
    {sku:24,brand:'Klipsch',model:'R-60 BOOKSHELF',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:275,dl:'2026-01-30',sp:220,ds:'2026-03-08',pay:'Cash',fees:0,ship:0,oth:0,msrp:400,notes:''},
    {sku:26,brand:'Klipsch',model:'R-60 BOOKSHELF',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:275,dl:'2026-01-30',sp:220,ds:'2026-03-08',pay:'Cash',fees:0,ship:0,oth:0,msrp:400,notes:''},
    {sku:23,brand:'Klipsch',model:'R-120SWI',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:175,dl:'2026-01-30',sp:160,ds:'2026-02-01',pay:'Cash',fees:0,ship:0,oth:0,msrp:300,notes:''},
    {sku:25,brand:'Klipsch',model:'R-60 BOOKSHELF',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:275,dl:'2026-01-30',sp:235,ds:'2026-02-05',pay:'Venmo',fees:4.56,ship:0,oth:0,msrp:400,notes:''},
    {sku:22,brand:'LG',model:'SN7R 5.1.2 CH SOUNDBAR',cat:'Electronics',pow:'Yes',fn:'Yes',acc:'Yes',miss:'Box',cos:'B',func:'C',cond:'Used - Fair',status:5,ch:'FBM',lp:65,dl:'2026-01-17',sp:65,ds:'2026-02-04',pay:'Venmo',fees:1.33,ship:0,oth:0,msrp:400,notes:'Subwoofer not working'},
    {sku:10,brand:'Marshall',model:'KILBURN II BT',cat:'Electronics',pow:'Yes',fn:'Yes',acc:'Yes',miss:'',cos:'A',func:'A',cond:'OB/LN',status:5,ch:'FBM',lp:160,dl:'2026-01-17',sp:130,ds:'2026-01-19',pay:'Venmo',fees:2.52,ship:0,oth:0,msrp:200,notes:''},
    {sku:11,brand:'Marshall',model:'KILBURN II BT',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:160,dl:'2026-01-17',sp:130,ds:'2026-01-19',pay:'Venmo',fees:2.52,ship:0,oth:0,msrp:200,notes:''},
    {sku:1,brand:'Onkyo',model:'TX-NR6050 7.2 CH',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:375,dl:'2026-01-15',sp:330,ds:'2026-01-29',pay:'Venmo',fees:6.36,ship:0,oth:0,msrp:500,notes:''},
    {sku:21,brand:'Samsung',model:'HW-Q60CF',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:185,dl:'2026-01-29',sp:175,ds:'2026-03-06',pay:'Cash',fees:0,ship:0,oth:0,msrp:500,notes:''},
    {sku:15,brand:'Samsung',model:'HW-B73CD',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:125,dl:'2026-01-30',sp:110,ds:'2026-03-03',pay:'Venmo',fees:2.14,ship:0,oth:0,msrp:300,notes:''},
    {sku:16,brand:'Samsung',model:'HW-B73CD',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:125,dl:'2026-01-30',sp:110,ds:'2026-03-03',pay:'Venmo',fees:2.14,ship:0,oth:0,msrp:300,notes:''},
    {sku:14,brand:'Samsung',model:'HW-B73CD',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:125,dl:'2026-01-30',sp:110,ds:'2026-02-07',pay:'Cash',fees:0,ship:0,oth:0,msrp:300,notes:''},
    {sku:12,brand:'Samsung',model:'HW-B73CD',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:150,dl:'2026-01-24',sp:150,ds:'2026-01-26',pay:'Cash',fees:0,ship:0,oth:0,msrp:300,notes:''},
    {sku:13,brand:'Samsung',model:'HW-B73CD',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:125,dl:'2026-01-30',sp:89,ds:'2026-02-04',pay:'Cash',fees:0,ship:0,oth:0,msrp:300,notes:''},
    {sku:17,brand:'Samsung',model:'HW-B73CD',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:125,dl:'2026-01-30',sp:100,ds:'2026-02-05',pay:'Cash',fees:0,ship:0,oth:0,msrp:300,notes:'Kept for apartment'},
    {sku:18,brand:'Samsung',model:'HW-B73CD',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:125,dl:'2026-01-30',sp:100,ds:'2026-02-05',pay:'Cash',fees:0,ship:0,oth:0,msrp:300,notes:'Kept for apartment'},
    {sku:19,brand:'Samsung',model:'HW-Q60CF',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:185,dl:'2026-01-24',sp:175,ds:'2026-02-05',pay:'Cash & Venmo',fees:1.52,ship:0,oth:0,msrp:500,notes:''},
    {sku:20,brand:'Samsung',model:'HW-Q60CF',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'FBM',lp:185,dl:'2026-01-29',sp:185,ds:'2026-02-07',pay:'Cash',fees:0,ship:0,oth:0,msrp:500,notes:''},
    {sku:3,brand:'Sony',model:'HT-A5000 5.1.2CH',cat:'Electronics',pow:'Not Tested (Sealed)',fn:'Not Tested (Sealed)',acc:'Yes',miss:'',cos:'A',func:'A (Sealed)',cond:'OB/LN',status:5,ch:'eBay',lp:250,dl:'2026-01-24',sp:225,ds:'2026-01-31',pay:'Credit Card',fees:35.7,ship:20.84,oth:0,msrp:650,notes:''},
    {sku:28,brand:'Sony',model:'HT-SC40 SOUNDBAR',cat:'Electronics',pow:'Yes',fn:'No',acc:'Yes',miss:'Box',cos:'B',func:'C',cond:'Salvage/Parts',status:5,ch:'FBM',lp:25,dl:'2026-01-24',sp:20,ds:'2026-02-01',pay:'Cash',fees:0,ship:0,oth:0,msrp:160,notes:'Turns on, but doesn\'t work'},
    {sku:29,brand:'Sony',model:'HT-SC40 SOUNDBAR',cat:'Electronics',pow:'Yes',fn:'Yes',acc:'Yes',miss:'',cos:'A',func:'A',cond:'OB/LN',status:5,ch:'FBM',lp:100,dl:'2026-01-29',sp:90,ds:'2026-01-31',pay:'Cash',fees:0,ship:0,oth:0,msrp:160,notes:''},
    {sku:30,brand:'Sony',model:'HT-SC40 SOUNDBAR',cat:'Electronics',pow:'Yes',fn:'Yes',acc:'Yes',miss:'',cos:'A',func:'A',cond:'OB/LN',status:5,ch:'FBM',lp:100,dl:'2026-01-29',sp:100,ds:'2026-01-31',pay:'Cash',fees:0,ship:0,oth:0,msrp:160,notes:''},
    {sku:4,brand:'Soundcore',model:'BOOM V2 BT',cat:'Electronics',pow:'Yes',fn:'Yes',acc:'Yes',miss:'',cos:'A',func:'A',cond:'OB/LN',status:5,ch:'FBM',lp:60,dl:'2026-01-24',sp:55,ds:'2026-02-05',pay:'Cash',fees:0,ship:0,oth:0,msrp:100,notes:''},
    {sku:5,brand:'Soundcore',model:'BOOM V2 BT',cat:'Electronics',pow:'Yes',fn:'Yes',acc:'Yes',miss:'',cos:'A',func:'A',cond:'OB/LN',status:5,ch:'FBM',lp:65,dl:'2026-01-24',sp:65,ds:'2026-01-27',pay:'Cash',fees:0,ship:0,oth:0,msrp:100,notes:''},
    {sku:6,brand:'Soundcore',model:'BOOM V2 BT',cat:'Electronics',pow:'Yes',fn:'Yes',acc:'Yes',miss:'',cos:'A',func:'A',cond:'OB/LN',status:5,ch:'FBM',lp:65,dl:'2026-01-24',sp:55,ds:'2026-01-29',pay:'CashApp',fees:0,ship:0,oth:0,msrp:100,notes:''},
    {sku:7,brand:'Soundcore',model:'BOOM V2 BT',cat:'Electronics',pow:'Yes',fn:'Yes',acc:'Yes',miss:'',cos:'A',func:'A',cond:'OB/LN',status:5,ch:'FBM',lp:65,dl:'2026-01-24',sp:55,ds:'2026-01-29',pay:'CashApp',fees:0,ship:0,oth:0,msrp:100,notes:''},
    {sku:8,brand:'Soundcore',model:'BOOM V2 BT',cat:'Electronics',pow:'Yes',fn:'Yes',acc:'Yes',miss:'',cos:'A',func:'A',cond:'OB/LN',status:5,ch:'FBM',lp:60,dl:'2026-01-24',sp:55,ds:'2026-02-05',pay:'Cash',fees:0,ship:0,oth:0,msrp:100,notes:''},
    {sku:9,brand:'Soundcore',model:'BOOM V2 BT',cat:'Electronics',pow:'Yes',fn:'Yes',acc:'Yes',miss:'',cos:'A',func:'A',cond:'OB/LN',status:5,ch:'FBM',lp:60,dl:'2026-01-24',sp:55,ds:'2026-02-05',pay:'Cash',fees:0,ship:0,oth:0,msrp:100,notes:''},
    {sku:27,brand:'Yamaha',model:'ATS-1090 SOUNDBAR',cat:'Electronics',pow:'No',fn:'No',acc:'Yes',miss:'',cos:'B',func:'C',cond:'Salvage/Parts',status:5,ch:'FBM',lp:15,dl:'2026-01-30',sp:10,ds:'2026-02-12',pay:'Cash',fees:0,ship:0,oth:0,msrp:150,notes:'Broken'},
  ];

  let maxSku = 0;
  lot1Items.forEach(d => {
    const item = {
      sku: d.sku, lotId: 1, category: d.cat, brand: d.brand, model: d.model,
      msrp: d.msrp, powersOn: d.pow, coreFunction: d.fn, accessories: d.acc,
      missingItems: d.miss, cosmeticGrade: d.cos, functionalGrade: d.func,
      listedCondition: d.cond, listingStatus: d.status, listingChannel: d.ch,
      listPrice: d.lp, dateListed: d.dl, salePrice: d.sp, dateSold: d.ds,
      paymentMethod: d.pay, platformFees: d.fees, shippingCost: d.ship,
      otherCosts: d.oth, notes: d.notes
    };
    calcItem(item);
    DATA.items.push(item);
    if (d.sku > maxSku) maxSku = d.sku;
  });

  DATA.nextSKU = maxSku + 1;
  saveData();
}

// ===== INIT =====
seedLot1();
updateLotFilters();
renderDashboard();

// Update tab badges
function updateBadges() {
  const open = DATA.items.filter(i => i.listingStatus != 5).length;
  const sold = DATA.items.filter(i => i.listingStatus == 5).length;
  document.querySelectorAll('.tab').forEach(t => {
    if (t.dataset.tab === 'open' && open > 0) t.innerHTML = `Open Inventory <span class="badge">${open}</span>`;
    if (t.dataset.tab === 'sold') t.innerHTML = `Sold Items <span class="badge">${sold}</span>`;
    if (t.dataset.tab === 'all') t.innerHTML = `All Inventory <span class="badge">${DATA.items.length}</span>`;
  });
}
updateBadges();

// ===== RESIZABLE COLUMNS =====
document.addEventListener('mousedown', function(e) {
  if (!e.target.classList.contains('col-resize')) return;
  e.preventDefault();
  const th = e.target.parentElement;
  const table = th.closest('table');
  const startX = e.pageX;
  const startW = th.offsetWidth;
  table.style.tableLayout = 'fixed';
  // Set all columns to their current width to lock them
  const ths = table.querySelectorAll('th');
  ths.forEach(t => { t.style.width = t.offsetWidth + 'px'; });
  e.target.classList.add('active');

  function onMove(ev) {
    const diff = ev.pageX - startX;
    th.style.width = Math.max(40, startW + diff) + 'px';
  }
  function onUp() {
    e.target.classList.remove('active');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

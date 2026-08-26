export interface Business {
  id: string;
  name: string;
  type: 'business' | 'asset' | 'investment';
  dailyIncome: number;
  description: string;
  icon: string;
}

export const BUSINESSES: Record<string, Business> = {
  vending_machine: { id: 'vending_machine', name: 'Vending Machine', type: 'business', dailyIncome: 5, description: 'Steady coins in high-traffic areas.', icon: 'cart-outline' },
  lemonade_stand: { id: 'lemonade_stand', name: 'Premium Lemonade Stand', type: 'business', dailyIncome: 12, description: 'Organic, locally sourced lemonade.', icon: 'water-outline' },
  dropshipping: { id: 'dropshipping', name: 'Dropshipping Store', type: 'business', dailyIncome: 40, description: 'Selling viral gadgets online.', icon: 'globe-outline' },
  car_wash: { id: 'car_wash', name: 'Hand Car Wash', type: 'business', dailyIncome: 150, description: 'Premium detailing service.', icon: 'car-sport-outline' },
  laundromat: { id: 'laundromat', name: 'Laundromat', type: 'business', dailyIncome: 250, description: 'Coin-operated cash cow.', icon: 'shirt-outline' },
  food_truck: { id: 'food_truck', name: 'Gourmet Food Truck', type: 'business', dailyIncome: 400, description: 'Trendy tacos and fusion food.', icon: 'restaurant-outline' },
  rental_property: { id: 'rental_property', name: 'Duplex Rental', type: 'asset', dailyIncome: 600, description: 'Passive rental income.', icon: 'home-outline' },
  gym: { id: 'gym', name: 'Boutique Gym', type: 'business', dailyIncome: 1200, description: 'High-margin memberships.', icon: 'barbell-outline' },
  tech_startup: { id: 'tech_startup', name: 'SaaS Startup', type: 'business', dailyIncome: 5000, description: 'B2B software with MRR.', icon: 'laptop-outline' },
  commercial_real_estate: { id: 'commercial_real_estate', name: 'Commercial Plaza', type: 'asset', dailyIncome: 12000, description: 'Triple net leases.', icon: 'business-outline' },
  luxury_hotel: { id: 'luxury_hotel', name: 'Luxury Hotel', type: 'business', dailyIncome: 35000, description: '5-star resort.', icon: 'bed-outline' },
  crypto_mine: { id: 'crypto_mine', name: 'Crypto Mining Farm', type: 'business', dailyIncome: 55000, description: 'Converting electricity to internet money.', icon: 'hardware-chip-outline' },
  private_island: { id: 'private_island', name: 'Private Island Resort', type: 'asset', dailyIncome: 120000, description: 'Exclusive retreats for billionaires.', icon: 'boat-outline' },
  hedge_fund: { id: 'hedge_fund', name: 'Hedge Fund', type: 'business', dailyIncome: 500000, description: '2 and 20 fee structure.', icon: 'pie-chart-outline' },
  space_company: { id: 'space_company', name: 'Aerospace Contractor', type: 'business', dailyIncome: 2500000, description: 'Government contracts for orbit.', icon: 'rocket-outline' },
  ai_monopoly: { id: 'ai_monopoly', name: 'AGI Corporation', type: 'business', dailyIncome: 15000000, description: 'Owning the future of intelligence.', icon: 'logo-electron' },
};

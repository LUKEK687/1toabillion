import { Business } from './businesses';
import { MONEY_EVENT_SCENARIOS } from './events';

export interface Outcome {
  weight: number;
  text: string;
  cashChange: number; // positive or negative, > -1 to 1 treated as percentage if we wanted, but let's stick to absolute or logic in engine
  isMultiplier?: boolean; // if true, cashChange of 1.5 means +50%
  riskChange: number;
  businessUnlocked?: string;
  businessLost?: string;
}

export interface Choice {
  id: string;
  text: string;
  cost: number;
  outcomes: Outcome[];
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  minNetWorth: number;
  maxNetWorth: number;
  category: 'business' | 'lifestyle' | 'investment' | 'asset' | 'random';
  choices: Choice[];
}

const generateScenarios = (): Scenario[] => {
  const scenarios: Scenario[] = [];

  // Helper to add
  const add = (
    tier: number,
    id: string,
    title: string,
    description: string,
    category: Scenario['category'],
    choices: Choice[]
  ) => {
    let minNetWorth = 0;
    let maxNetWorth = Number.MAX_SAFE_INTEGER;
    if (tier === 1) { minNetWorth = 1; maxNetWorth = 100; }
    else if (tier === 2) { minNetWorth = 100; maxNetWorth = 1000; }
    else if (tier === 3) { minNetWorth = 1000; maxNetWorth = 10000; }
    else if (tier === 4) { minNetWorth = 10000; maxNetWorth = 100000; }
    else if (tier === 5) { minNetWorth = 100000; maxNetWorth = 1000000; }
    else if (tier === 6) { minNetWorth = 1000000; maxNetWorth = 100000000; }
    else if (tier === 7) { minNetWorth = 100000000; maxNetWorth = 1000000000; }

    scenarios.push({ id, title, description, minNetWorth, maxNetWorth, category, choices });
  };

  // --- TIER 1: $1 to $1,000 (The Hustle) - 15 scenarios ---
  add(1, 't1_1', 'Found a Dollar', 'You spot a crisp $1 bill on the sidewalk.', 'random', [
    { id: 'c1', text: 'Pick it up', cost: 0, outcomes: [{ weight: 1, text: 'Sweet.', cashChange: 1, riskChange: 0 }] },
    { id: 'c2', text: 'Leave it for someone else', cost: 0, outcomes: [{ weight: 1, text: 'Good karma.', cashChange: 0, riskChange: -5 }] }
  ]);
  add(1, 't1_2', 'Flipping Items', 'Buy cheap electronics online and resell locally.', 'business', [
    { id: 'c1', text: 'Invest $10', cost: 10, outcomes: [
      { weight: 70, text: 'Sold for profit.', cashChange: 25, riskChange: 5 },
      { weight: 30, text: 'Got scammed.', cashChange: -10, riskChange: 10 }
    ]},
    { id: 'c2', text: 'Skip it', cost: 0, outcomes: [{ weight: 1, text: 'Better safe than sorry.', cashChange: 0, riskChange: -2 }] }
  ]);
  add(1, 't1_3', 'Lawn Mowing', 'A neighbor offers $20 to mow their overgrown lawn.', 'business', [
    { id: 'c1', text: 'Do the work', cost: 0, outcomes: [{ weight: 1, text: 'Hard work pays off.', cashChange: 20, riskChange: 0 }] },
    { id: 'c2', text: 'Outsource to a kid for $10', cost: 10, outcomes: [
      { weight: 80, text: 'Kid did it, you kept the spread.', cashChange: 10, riskChange: 5 },
      { weight: 20, text: 'Kid broke a window. You owe.', cashChange: -50, riskChange: 15 }
    ]}
  ]);
  add(2, 't1_4', 'Buy a Vending Machine', 'A used vending machine is for sale.', 'business', [
    { id: 'c1', text: 'Buy it ($300)', cost: 300, outcomes: [
      { weight: 1, text: 'You are now a business owner.', cashChange: -300, riskChange: 10, businessUnlocked: 'vending_machine' }
    ]},
    { id: 'c2', text: 'Not yet', cost: 0, outcomes: [{ weight: 1, text: 'Holding cash.', cashChange: 0, riskChange: 0 }] }
  ]);
  add(2, 't1_5', 'Penny Stocks', 'A friend says a certain penny stock is going to the moon.', 'investment', [
    { id: 'c1', text: 'YOLO $50', cost: 50, outcomes: [
      { weight: 20, text: 'It 10x\'d!', cashChange: 500, riskChange: 20 },
      { weight: 80, text: 'Rug pull. It\'s gone.', cashChange: -50, riskChange: 15 }
    ]},
    { id: 'c2', text: 'Ignore', cost: 0, outcomes: [{ weight: 1, text: 'Dodged a bullet.', cashChange: 0, riskChange: -5 }] }
  ]);
  add(1, 't1_6', 'Lemonade Stand', 'Summer heat wave. Perfect time for lemonade.', 'business', [
    { id: 'c1', text: 'Start Stand ($50)', cost: 50, outcomes: [
      { weight: 1, text: 'Refreshing income stream.', cashChange: -50, riskChange: 5, businessUnlocked: 'lemonade_stand' }
    ]},
    { id: 'c2', text: 'Too hot to work', cost: 0, outcomes: [{ weight: 1, text: 'Stayed inside.', cashChange: 0, riskChange: 0 }] }
  ]);
  add(1, 't1_7', 'Garage Sale', 'Host a garage sale with old junk.', 'business', [
    { id: 'c1', text: 'Sell it all', cost: 0, outcomes: [{ weight: 1, text: 'Cleared the garage.', cashChange: 75, riskChange: 0 }] }
  ]);
  add(1, 't1_8', 'Freelance Gig', 'Someone needs a logo designed on Fiverr.', 'business', [
    { id: 'c1', text: 'Take job', cost: 0, outcomes: [
      { weight: 90, text: 'Client happy.', cashChange: 40, riskChange: 0 },
      { weight: 10, text: 'Client charged back.', cashChange: 0, riskChange: 5 }
    ]}
  ]);
  add(1, 't1_9', 'Street Performer', 'Busking downtown.', 'lifestyle', [
    { id: 'c1', text: 'Play guitar', cost: 0, outcomes: [{ weight: 1, text: 'Made some tips.', cashChange: 15, riskChange: 2 }] }
  ]);
  add(1, 't1_10', 'Dog Walking', 'Walk neighborhood dogs.', 'business', [
    { id: 'c1', text: 'Walk 3 dogs', cost: 0, outcomes: [{ weight: 1, text: 'Good exercise.', cashChange: 45, riskChange: 0 }] }
  ]);
  add(1, 't1_11', 'Lost Wallet', 'You find a wallet with cash.', 'random', [
    { id: 'c1', text: 'Return it', cost: 0, outcomes: [{ weight: 1, text: 'Owner gave a $20 reward.', cashChange: 20, riskChange: -10 }] },
    { id: 'c2', text: 'Keep cash ($100)', cost: 0, outcomes: [{ weight: 1, text: 'Kept the cash, feel guilty.', cashChange: 100, riskChange: 20 }] }
  ]);
  add(1, 't1_12', 'Blood Donation', 'Donate plasma for quick cash.', 'lifestyle', [
    { id: 'c1', text: 'Donate', cost: 0, outcomes: [{ weight: 1, text: 'Feeling lightheaded but richer.', cashChange: 60, riskChange: 5 }] }
  ]);
  add(1, 't1_13', 'Lottery Ticket', 'Scratcher ticket looks tempting.', 'random', [
    { id: 'c1', text: 'Buy ($5)', cost: 5, outcomes: [
      { weight: 5, text: 'Won $100!', cashChange: 100, riskChange: 10 },
      { weight: 95, text: 'Nothing.', cashChange: -5, riskChange: 5 }
    ]},
    { id: 'c2', text: 'Skip', cost: 0, outcomes: [{ weight: 1, text: 'Tax on the poor.', cashChange: 0, riskChange: 0 }] }
  ]);
  add(1, 't1_14', 'Survey App', 'Take online surveys.', 'business', [
    { id: 'c1', text: 'Waste 2 hours', cost: 0, outcomes: [{ weight: 1, text: 'Made $3.', cashChange: 3, riskChange: 0 }] }
  ]);
  add(2, 't1_15', 'Broken Phone', 'Your screen cracked.', 'random', [
    { id: 'c1', text: 'Fix it ($150)', cost: 150, outcomes: [{ weight: 1, text: 'Looks new.', cashChange: -150, riskChange: -5 }] },
    { id: 'c2', text: 'Ignore it', cost: 0, outcomes: [{ weight: 1, text: 'Hard to read now.', cashChange: 0, riskChange: 10 }] }
  ]);

  // --- TIER 2: $1K to $100K (The Grind) - 15 scenarios ---
  add(2, 't2_1', 'Dropshipping Course', 'An influencer is selling a course.', 'investment', [
    { id: 'c1', text: 'Buy Course ($500)', cost: 500, outcomes: [
      { weight: 30, text: 'Actually useful! Started a store.', cashChange: -500, riskChange: 15, businessUnlocked: 'dropshipping' },
      { weight: 70, text: 'Total scam.', cashChange: -500, riskChange: 10 }
    ]},
    { id: 'c2', text: 'Watch YouTube for free', cost: 0, outcomes: [{ weight: 1, text: 'Learned the basics safely.', cashChange: 0, riskChange: 0 }] }
  ]);
  add(3, 't2_2', 'Used Car Flip', 'Found a Honda Civic under market value.', 'business', [
    { id: 'c1', text: 'Buy for $3k', cost: 3000, outcomes: [
      { weight: 80, text: 'Flipped for $5k!', cashChange: 2000, riskChange: 10 },
      { weight: 20, text: 'Engine blew up. Sold for parts.', cashChange: -1500, riskChange: 15 }
    ]},
    { id: 'c2', text: 'Too risky', cost: 0, outcomes: [{ weight: 1, text: 'Passed on the car.', cashChange: 0, riskChange: -5 }] }
  ]);
  add(3, 't2_3', 'Crypto Dip', 'Bitcoin crashed 20% today.', 'investment', [
    { id: 'c1', text: 'Buy the dip ($2k)', cost: 2000, outcomes: [
      { weight: 50, text: 'Rebounded nicely.', cashChange: 1000, riskChange: 15 },
      { weight: 50, text: 'It kept dipping.', cashChange: -1000, riskChange: 20 }
    ]},
    { id: 'c2', text: 'Wait', cost: 0, outcomes: [{ weight: 1, text: 'Cash is a position.', cashChange: 0, riskChange: 0 }] }
  ]);
  add(3, 't2_4', 'Open a Car Wash', 'A local spot is leasing space.', 'business', [
    { id: 'c1', text: 'Lease it ($5k)', cost: 5000, outcomes: [{ weight: 1, text: 'Got the keys!', cashChange: -5000, riskChange: 15, businessUnlocked: 'car_wash' }] },
    { id: 'c2', text: 'Pass', cost: 0, outcomes: [{ weight: 1, text: 'Avoided overhead.', cashChange: 0, riskChange: 0 }] }
  ]);
  add(4, 't2_5', 'Laundromat For Sale', 'Aging owner wants out.', 'business', [
    { id: 'c1', text: 'Buy ($20k)', cost: 20000, outcomes: [{ weight: 1, text: 'Steady passive income.', cashChange: -20000, riskChange: 10, businessUnlocked: 'laundromat' }] },
    { id: 'c2', text: 'Pass', cost: 0, outcomes: [{ weight: 1, text: 'Saved your cash.', cashChange: 0, riskChange: 0 }] }
  ]);
  add(3, 't2_6', 'Tax Audit', 'The IRS has questions.', 'random', [
    { id: 'c1', text: 'Hire CPA ($1k)', cost: 1000, outcomes: [{ weight: 1, text: 'CPA cleared it up.', cashChange: -1000, riskChange: -20 }] },
    { id: 'c2', text: 'Defend yourself', cost: 0, outcomes: [
      { weight: 40, text: 'You won.', cashChange: 0, riskChange: 0 },
      { weight: 60, text: 'Fined heavily.', cashChange: -5000, riskChange: 30 }
    ]}
  ]);
  add(3, 't2_7', 'Stock Options', 'Earnings call coming up.', 'investment', [
    { id: 'c1', text: 'Buy Calls ($1k)', cost: 1000, outcomes: [
      { weight: 20, text: 'Massive beat! +400%', cashChange: 4000, riskChange: 30 },
      { weight: 80, text: 'Missed. Options expired worthless.', cashChange: -1000, riskChange: 20 }
    ]}
  ]);
  add(4, 't2_8', 'Food Truck', 'Used food truck for sale.', 'business', [
    { id: 'c1', text: 'Buy ($15k)', cost: 15000, outcomes: [{ weight: 1, text: 'Time to sell tacos.', cashChange: -15000, riskChange: 15, businessUnlocked: 'food_truck' }] },
    { id: 'c2', text: 'Too much work', cost: 0, outcomes: [{ weight: 1, text: 'Avoided the stress.', cashChange: 0, riskChange: 0 }] }
  ]);
  add(3, 't2_9', 'Friends Wedding', 'Destination wedding in Mexico.', 'lifestyle', [
    { id: 'c1', text: 'Go ($3k)', cost: 3000, outcomes: [{ weight: 1, text: 'Had a great time.', cashChange: -3000, riskChange: -10 }] },
    { id: 'c2', text: 'Send gift ($200)', cost: 200, outcomes: [{ weight: 1, text: 'Friend understands.', cashChange: -200, riskChange: 0 }] }
  ]);
  add(2, 't2_10', 'Robbery', 'Someone broke into your car.', 'random', [
    { id: 'c1', text: 'Pay deductible ($500)', cost: 500, outcomes: [{ weight: 1, text: 'Window fixed.', cashChange: -500, riskChange: 5 }] }
  ]);
  add(3, 't2_11', 'Viral TikTok', 'Your product went viral.', 'business', [
    { id: 'c1', text: 'Double ad spend ($2k)', cost: 2000, outcomes: [
      { weight: 70, text: 'Massive sales spike!', cashChange: 10000, riskChange: 10 },
      { weight: 30, text: 'Trend died instantly.', cashChange: -2000, riskChange: 5 }
    ]}
  ]);
  add(2, 't2_12', 'Local Sponsor', 'Sponsor a little league team.', 'lifestyle', [
    { id: 'c1', text: 'Sponsor ($500)', cost: 500, outcomes: [{ weight: 1, text: 'Good PR.', cashChange: -500, riskChange: -5 }] }
  ]);
  add(2, 't2_13', 'Index Funds', 'Safe investing.', 'investment', [
    { id: 'c1', text: 'Deposit $5k', cost: 5000, outcomes: [{ weight: 1, text: 'Slow and steady.', cashChange: -5000, isMultiplier: false, riskChange: -5 }] } 
    // Note: for simplicity in engine, cashChange is direct. We'll just give a small return.
  ]);
  // Redoing t2_13 to have a return
  add(3, 't2_13_b', 'Index Funds', 'Market is up.', 'investment', [
    { id: 'c1', text: 'Deposit $5k', cost: 5000, outcomes: [{ weight: 1, text: 'Safe return.', cashChange: 500, riskChange: -10 }] }
  ]);
  add(2, 't2_14', 'Networking Event', 'Tickets are $200.', 'business', [
    { id: 'c1', text: 'Go', cost: 200, outcomes: [
      { weight: 50, text: 'Met a great contact.', cashChange: 2000, riskChange: 0 },
      { weight: 50, text: 'Waste of time.', cashChange: -200, riskChange: 0 }
    ]}
  ]);
  add(3, 't2_15', 'Equipment Failure', 'Server died.', 'random', [
    { id: 'c1', text: 'Replace ($2k)', cost: 2000, outcomes: [{ weight: 1, text: 'Back online.', cashChange: -2000, riskChange: 5 }] }
  ]);

  // --- TIER 3: $100K to $1M (Scaling) - 15 scenarios ---
  add(4, 't3_1', 'Duplex for Sale', 'Real estate opportunity.', 'investment', [
    { id: 'c1', text: 'Downpayment ($40k)', cost: 40000, outcomes: [{ weight: 1, text: 'You are a landlord!', cashChange: -40000, riskChange: 10, businessUnlocked: 'rental_property' }] },
    { id: 'c2', text: 'Too much hassle', cost: 0, outcomes: [{ weight: 1, text: 'Passed.', cashChange: 0, riskChange: -5 }] }
  ]);
  add(4, 't3_2', 'Angel Investing', 'Friend\'s tech startup needs seed money.', 'investment', [
    { id: 'c1', text: 'Invest $25k', cost: 25000, outcomes: [
      { weight: 15, text: 'They got acquired!', cashChange: 200000, riskChange: 25 },
      { weight: 85, text: 'They went bankrupt.', cashChange: -25000, riskChange: 15 }
    ]},
    { id: 'c2', text: 'Pass', cost: 0, outcomes: [{ weight: 1, text: 'Protected capital.', cashChange: 0, riskChange: -5 }] }
  ]);
  add(4, 't3_3', 'Open a Gym', 'Boutique fitness is trending.', 'business', [
    { id: 'c1', text: 'Open Gym ($80k)', cost: 80000, outcomes: [{ weight: 1, text: 'Pumping iron and cash.', cashChange: -80000, riskChange: 15, businessUnlocked: 'gym' }] },
    { id: 'c2', text: 'Pass', cost: 0, outcomes: [{ weight: 1, text: 'Avoided liability.', cashChange: 0, riskChange: 0 }] }
  ]);
  add(4, 't3_4', 'Lawsuit', 'A customer slipped and fell.', 'random', [
    { id: 'c1', text: 'Settle ($30k)', cost: 30000, outcomes: [{ weight: 1, text: 'It goes away quietly.', cashChange: -30000, riskChange: -10 }] },
    { id: 'c2', text: 'Fight it in court', cost: 0, outcomes: [
      { weight: 30, text: 'You won the case.', cashChange: -5000, riskChange: 10 },
      { weight: 70, text: 'Lost big.', cashChange: -100000, riskChange: 30 }
    ]}
  ]);
  add(5, 't3_5', 'Buy a Porsche', 'Treat yourself?', 'lifestyle', [
    { id: 'c1', text: 'Buy it ($120k)', cost: 120000, outcomes: [{ weight: 1, text: 'Vroom vroom.', cashChange: -120000, riskChange: 10 }] },
    { id: 'c2', text: 'Stay humble', cost: 0, outcomes: [{ weight: 1, text: 'Drove the Civic.', cashChange: 0, riskChange: -5 }] }
  ]);
  add(5, 't3_6', 'Franchise Opportunity', 'Fast food franchise.', 'business', [
    { id: 'c1', text: 'Buy in ($150k)', cost: 150000, outcomes: [
      { weight: 70, text: 'Steady profits.', cashChange: 50000, riskChange: 10 },
      { weight: 30, text: 'Bad location.', cashChange: -50000, riskChange: 20 }
    ]}
  ]);
  add(4, 't3_7', 'Stock Crash', 'S&P 500 drops 15%.', 'investment', [
    { id: 'c1', text: 'Buy the dip ($50k)', cost: 50000, outcomes: [
      { weight: 60, text: 'V-shape recovery!', cashChange: 25000, riskChange: 15 },
      { weight: 40, text: 'It kept falling.', cashChange: -20000, riskChange: 20 }
    ]},
    { id: 'c2', text: 'Panic Sell', cost: 0, outcomes: [{ weight: 1, text: 'Locked in losses.', cashChange: -10000, riskChange: -10 }] }
  ]);
  add(5, 't3_8', 'Hire CEO', 'Step back from daily ops.', 'business', [
    { id: 'c1', text: 'Hire ($100k salary)', cost: 100000, outcomes: [
      { weight: 80, text: 'Business grew 2x.', cashChange: 200000, riskChange: -15 },
      { weight: 20, text: 'CEO ruined the culture.', cashChange: -150000, riskChange: 30 }
    ]}
  ]);
  add(4, 't3_9', 'Charity Gala', 'Local hospital fundraiser.', 'lifestyle', [
    { id: 'c1', text: 'Donate $10k', cost: 10000, outcomes: [{ weight: 1, text: 'Feels good.', cashChange: -10000, riskChange: -10 }] }
  ]);
  add(5, 't3_10', 'Competitor Buying', 'Competitor offers to buy your smallest asset.', 'business', [
    { id: 'c1', text: 'Sell ($150k)', cost: 0, outcomes: [{ weight: 1, text: 'Cashed out.', cashChange: 150000, riskChange: -5 }] },
    { id: 'c2', text: 'Hold', cost: 0, outcomes: [{ weight: 1, text: 'Diamond hands.', cashChange: 0, riskChange: 5 }] }
  ]);
  add(4, 't3_11', 'Rolex Watch', 'Show status.', 'lifestyle', [
    { id: 'c1', text: 'Buy ($15k)', cost: 15000, outcomes: [{ weight: 1, text: 'Nice watch.', cashChange: -15000, riskChange: 0 }] }
  ]);
  add(5, 't3_12', 'Software Startup', 'Start a SaaS.', 'business', [
    { id: 'c1', text: 'Fund it ($200k)', cost: 200000, outcomes: [{ weight: 1, text: 'Building the MVP.', cashChange: -200000, riskChange: 20, businessUnlocked: 'tech_startup' }] }
  ]);
  add(4, 't3_13', 'Tax Loophole', 'Accountant found a grey area.', 'random', [
    { id: 'c1', text: 'Exploit it', cost: 0, outcomes: [
      { weight: 50, text: 'Saved $40k!', cashChange: 40000, riskChange: 20 },
      { weight: 50, text: 'Caught. Fined $80k.', cashChange: -80000, riskChange: 30 }
    ]},
    { id: 'c2', text: 'Play it safe', cost: 0, outcomes: [{ weight: 1, text: 'Paid full taxes.', cashChange: -20000, riskChange: -10 }] }
  ]);
  add(4, 't3_14', 'Vacation', 'Burnout is real.', 'lifestyle', [
    { id: 'c1', text: 'Maldives ($20k)', cost: 20000, outcomes: [{ weight: 1, text: 'Fully rested.', cashChange: -20000, riskChange: -20 }] }
  ]);
  add(4, 't3_15', 'Bad PR', 'Cancelled on Twitter.', 'random', [
    { id: 'c1', text: 'Hire PR firm ($30k)', cost: 30000, outcomes: [{ weight: 1, text: 'Crisis managed.', cashChange: -30000, riskChange: -10 }] },
    { id: 'c2', text: 'Apologize on video', cost: 0, outcomes: [
      { weight: 20, text: 'Forgiven.', cashChange: 0, riskChange: -5 },
      { weight: 80, text: 'Made it worse. Lost sales.', cashChange: -100000, riskChange: 25 }
    ]}
  ]);

  // --- TIER 4: $1M to $10M (The Big Leagues) - 15 scenarios ---
  add(6, 't4_1', 'Commercial Real Estate', 'A local plaza is for sale.', 'investment', [
    { id: 'c1', text: 'Buy ($1.5M)', cost: 1500000, outcomes: [{ weight: 1, text: 'Triple net leases secured.', cashChange: -1500000, riskChange: 15, businessUnlocked: 'commercial_real_estate' }] },
    { id: 'c2', text: 'Pass', cost: 0, outcomes: [{ weight: 1, text: 'Kept cash.', cashChange: 0, riskChange: -5 }] }
  ]);
  add(5, 't4_2', 'Private Equity', 'A PE firm wants to partner.', 'business', [
    { id: 'c1', text: 'Invest $1M', cost: 1000000, outcomes: [
      { weight: 60, text: 'Rolled up the industry. 3x return!', cashChange: 3000000, riskChange: 20 },
      { weight: 40, text: 'Overleveraged. Bankrupt.', cashChange: -1000000, riskChange: 30 }
    ]}
  ]);
  add(6, 't4_3', 'Luxury Hotel', 'Distressed property in Miami.', 'business', [
    { id: 'c1', text: 'Buy & Renovate ($3M)', cost: 3000000, outcomes: [{ weight: 1, text: 'Opening soon.', cashChange: -3000000, riskChange: 25, businessUnlocked: 'luxury_hotel' }] }
  ]);
  add(6, 't4_4', 'Art Collection', 'A Banksy is at auction.', 'investment', [
    { id: 'c1', text: 'Bid $1.2M', cost: 1200000, outcomes: [
      { weight: 50, text: 'Appreciated immediately.', cashChange: 500000, riskChange: 10 },
      { weight: 50, text: 'Market cooled. Illiquid.', cashChange: 0, riskChange: 15 }
    ]}
  ]);
  add(4, 't4_5', 'Divorce', 'Things fell apart.', 'random', [
    { id: 'c1', text: 'Settle (Lose 50%)', cost: 0, outcomes: [{ weight: 1, text: 'Painful but over.', cashChange: -1000000, isMultiplier: true, riskChange: -20 }] } 
    // Wait, isMultiplier requires engine logic. I'll just hardcode a flat huge loss for simplicity since engine handles flat.
  ]);
  // Redoing t4_5 for flat loss
  add(6, 't4_5_b', 'Divorce Settlement', 'Things fell apart.', 'random', [
    { id: 'c1', text: 'Settle ($2M)', cost: 2000000, outcomes: [{ weight: 1, text: 'Painful but over.', cashChange: -2000000, riskChange: -20 }] },
    { id: 'c2', text: 'Fight in Court ($500k fees)', cost: 500000, outcomes: [
      { weight: 50, text: 'Kept most assets.', cashChange: -500000, riskChange: 10 },
      { weight: 50, text: 'Lost court AND assets.', cashChange: -3000000, riskChange: 30 }
    ]}
  ]);
  add(6, 't4_6', 'Crypto Mining', 'Build a mining farm.', 'business', [
    { id: 'c1', text: 'Build ($2.5M)', cost: 2500000, outcomes: [{ weight: 1, text: 'Machines go brrr.', cashChange: -2500000, riskChange: 30, businessUnlocked: 'crypto_mine' }] }
  ]);
  add(6, 't4_7', 'Supercar Collection', 'Buy a Bugatti.', 'lifestyle', [
    { id: 'c1', text: 'Buy ($2.8M)', cost: 2800000, outcomes: [{ weight: 1, text: 'Flexing.', cashChange: -2800000, riskChange: 10 }] }
  ]);
  add(5, 't4_8', 'Venture Capital Fund', 'LP in a top tier fund.', 'investment', [
    { id: 'c1', text: 'Commit $1M', cost: 1000000, outcomes: [
      { weight: 30, text: 'Fund hit a unicorn! +$4M', cashChange: 4000000, riskChange: 20 },
      { weight: 70, text: 'Average returns.', cashChange: 200000, riskChange: 5 }
    ]}
  ]);
  add(5, 't4_9', 'Insider Info', 'Friend at hedge fund gave you a tip.', 'random', [
    { id: 'c1', text: 'Trade it ($1M)', cost: 1000000, outcomes: [
      { weight: 40, text: 'Made $3M!', cashChange: 3000000, riskChange: 40 },
      { weight: 60, text: 'SEC investigation. Fined $2M.', cashChange: -2000000, riskChange: 50 }
    ]},
    { id: 'c2', text: 'Refuse', cost: 0, outcomes: [{ weight: 1, text: 'Stayed out of jail.', cashChange: 0, riskChange: -10 }] }
  ]);
  add(5, 't4_10', 'Buy a Jet (Fractional)', 'NetJets membership.', 'lifestyle', [
    { id: 'c1', text: 'Sign up ($500k/yr)', cost: 500000, outcomes: [{ weight: 1, text: 'Time is money.', cashChange: -500000, riskChange: -5 }] }
  ]);
  add(5, 't4_11', 'Political Donation', 'Mayor needs funding.', 'lifestyle', [
    { id: 'c1', text: 'Donate $250k', cost: 250000, outcomes: [{ weight: 1, text: 'Favors owed.', cashChange: -250000, riskChange: -10 }] }
  ]);
  add(5, 't4_12', 'Yacht Charter', 'Summer in Monaco.', 'lifestyle', [
    { id: 'c1', text: 'Charter ($300k)', cost: 300000, outcomes: [{ weight: 1, text: 'Epic parties.', cashChange: -300000, riskChange: 5 }] }
  ]);
  add(6, 't4_13', 'Sports Team Minority Stake', 'Buy 1% of a team.', 'investment', [
    { id: 'c1', text: 'Buy ($4M)', cost: 4000000, outcomes: [
      { weight: 90, text: 'Valuations keep going up.', cashChange: 1000000, riskChange: 10 },
      { weight: 10, text: 'Scandal. Forced sale.', cashChange: -2000000, riskChange: 25 }
    ]}
  ]);
  add(5, 't4_14', 'Ransomware Attack', 'Hackers locked your servers.', 'random', [
    { id: 'c1', text: 'Pay Ransom ($500k)', cost: 500000, outcomes: [{ weight: 1, text: 'Data restored.', cashChange: -500000, riskChange: 10 }] },
    { id: 'c2', text: 'Rebuild ($1M)', cost: 1000000, outcomes: [{ weight: 1, text: 'Took offline for weeks.', cashChange: -1000000, riskChange: -5 }] }
  ]);
  add(5, 't4_15', 'Extortion', 'Tabloid has a bad photo.', 'random', [
    { id: 'c1', text: 'Pay ($200k)', cost: 200000, outcomes: [{ weight: 1, text: 'Buried.', cashChange: -200000, riskChange: 5 }] }
  ]);

  // --- TIER 5: $10M to $100M (Tycoon) - 10 scenarios ---
  add(6, 't5_1', 'Private Island', 'Island in the Bahamas for sale.', 'asset', [
    { id: 'c1', text: 'Buy ($15M)', cost: 15000000, outcomes: [{ weight: 1, text: 'Your own paradise.', cashChange: -15000000, riskChange: 10, businessUnlocked: 'private_island' }] },
    { id: 'c2', text: 'Pass', cost: 0, outcomes: [{ weight: 1, text: 'Too remote.', cashChange: 0, riskChange: 0 }] }
  ]);
  add(6, 't5_2', 'Hedge Fund', 'Start your own fund.', 'business', [
    { id: 'c1', text: 'Seed it ($25M)', cost: 25000000, outcomes: [{ weight: 1, text: '2 and 20.', cashChange: -25000000, riskChange: 30, businessUnlocked: 'hedge_fund' }] }
  ]);
  add(6, 't5_3', 'Superyacht', '150ft Custom Yacht.', 'lifestyle', [
    { id: 'c1', text: 'Build ($30M)', cost: 30000000, outcomes: [{ weight: 1, text: 'Money sink.', cashChange: -30000000, riskChange: 15 }] }
  ]);
  add(6, 't5_4', 'Hostile Takeover', 'Acquire a struggling public company.', 'business', [
    { id: 'c1', text: 'Launch Bid ($40M)', cost: 40000000, outcomes: [
      { weight: 50, text: 'Success! Turned it around.', cashChange: 30000000, riskChange: 20 },
      { weight: 50, text: 'Poison pill activated. Lost millions.', cashChange: -15000000, riskChange: 30 }
    ]}
  ]);
  add(6, 't5_5', 'Media Empire', 'Buy a national newspaper.', 'investment', [
    { id: 'c1', text: 'Buy ($20M)', cost: 20000000, outcomes: [{ weight: 1, text: 'You control the narrative.', cashChange: -20000000, riskChange: 10 }] }
  ]);
  add(6, 't5_6', 'Space Tourism', 'Pre-book a trip to orbit.', 'lifestyle', [
    { id: 'c1', text: 'Book ($5M)', cost: 5000000, outcomes: [{ weight: 1, text: 'Going to space!', cashChange: -5000000, riskChange: 25 }] }
  ]);
  add(6, 't5_7', 'Philanthropy', 'Build a hospital wing.', 'lifestyle', [
    { id: 'c1', text: 'Donate ($10M)', cost: 10000000, outcomes: [{ weight: 1, text: 'Legacy secured.', cashChange: -10000000, riskChange: -30 }] }
  ]);
  add(6, 't5_8', 'Short Squeeze', 'Retail traders are attacking your short position.', 'random', [
    { id: 'c1', text: 'Hold the line', cost: 0, outcomes: [
      { weight: 30, text: 'They ran out of money.', cashChange: 5000000, riskChange: 20 },
      { weight: 70, text: 'Margin called! Wiped out.', cashChange: -30000000, riskChange: 60 }
    ]},
    { id: 'c2', text: 'Cover loss ($15M)', cost: 15000000, outcomes: [{ weight: 1, text: 'Lived to trade another day.', cashChange: -15000000, riskChange: -10 }] }
  ]);
  add(6, 't5_9', 'Market Crash', 'Global pandemic halts economy.', 'random', [
    { id: 'c1', text: 'Buy Everything ($20M)', cost: 20000000, outcomes: [
      { weight: 80, text: 'Fed printed money. Massive win.', cashChange: 40000000, riskChange: 20 },
      { weight: 20, text: 'Depression era. Values tanked.', cashChange: -15000000, riskChange: 40 }
    ]},
    { id: 'c2', text: 'Move to Cash', cost: 0, outcomes: [{ weight: 1, text: 'Missed the rally.', cashChange: -5000000, riskChange: -20 }] }
  ]);
  add(6, 't5_10', 'Bunker', 'Doomsday prep in New Zealand.', 'lifestyle', [
    { id: 'c1', text: 'Build ($12M)', cost: 12000000, outcomes: [{ weight: 1, text: 'Ready for anything.', cashChange: -12000000, riskChange: -40 }] }
  ]);

  // --- TIER 6: $100M+ (Billionaire Bound) - 10 scenarios ---
  add(7, 't6_1', 'Space Company', 'Start building rockets.', 'business', [
    { id: 'c1', text: 'Fund it ($150M)', cost: 150000000, outcomes: [{ weight: 1, text: 'To Mars.', cashChange: -150000000, riskChange: 40, businessUnlocked: 'space_company' }] }
  ]);
  add(7, 't6_2', 'AI Monopoly', 'Fund the next AGI.', 'business', [
    { id: 'c1', text: 'Invest ($250M)', cost: 250000000, outcomes: [{ weight: 1, text: 'The singularity is near.', cashChange: -250000000, riskChange: 50, businessUnlocked: 'ai_monopoly' }] }
  ]);
  add(7, 't6_3', 'Buy a Sports Franchise', 'NFL team for sale.', 'investment', [
    { id: 'c1', text: 'Buy ($300M down)', cost: 300000000, outcomes: [
      { weight: 100, text: 'You are an owner.', cashChange: -300000000, riskChange: 10 }
    ]}
  ]);
  add(7, 't6_4', 'Presidential Campaign', 'Fund a candidate.', 'lifestyle', [
    { id: 'c1', text: 'Super PAC ($50M)', cost: 50000000, outcomes: [
      { weight: 50, text: 'They won. Taxes cut.', cashChange: 100000000, riskChange: 20 },
      { weight: 50, text: 'They lost.', cashChange: -50000000, riskChange: 10 }
    ]}
  ]);
  add(7, 't6_5', 'Metaverse Pivot', 'Rename your company to focus on VR.', 'business', [
    { id: 'c1', text: 'Burn $100M on R&D', cost: 100000000, outcomes: [
      { weight: 20, text: 'It worked!', cashChange: 300000000, riskChange: 30 },
      { weight: 80, text: 'Nobody wants legs in VR.', cashChange: -100000000, riskChange: 40 }
    ]}
  ]);
  add(7, 't6_6', 'Anti-Trust Lawsuit', 'Government wants to break you up.', 'random', [
    { id: 'c1', text: 'Lobby ($80M)', cost: 80000000, outcomes: [{ weight: 1, text: 'Lawsuit dropped.', cashChange: -80000000, riskChange: -20 }] },
    { id: 'c2', text: 'Fight in Court', cost: 0, outcomes: [
      { weight: 20, text: 'Won.', cashChange: 0, riskChange: 10 },
      { weight: 80, text: 'Broken up. Lost massive value.', cashChange: -200000000, riskChange: 50 }
    ]}
  ]);
  add(7, 't6_7', 'Cure Aging', 'Biotech startup.', 'investment', [
    { id: 'c1', text: 'Fund ($120M)', cost: 120000000, outcomes: [
      { weight: 10, text: 'Found the cure! Trillionaire status imminent.', cashChange: 800000000, riskChange: 40 },
      { weight: 90, text: 'Failed clinical trials.', cashChange: -120000000, riskChange: 20 }
    ]}
  ]);
  add(7, 't6_8', 'Massive Short', 'Bet against a country\'s currency.', 'investment', [
    { id: 'c1', text: 'Short ($200M)', cost: 200000000, outcomes: [
      { weight: 40, text: 'Broke the bank of England.', cashChange: 500000000, riskChange: 50 },
      { weight: 60, text: 'Squeezed.', cashChange: -200000000, riskChange: 60 }
    ]}
  ]);
  add(7, 't6_9', 'Island Nation', 'Buy a sovereign country.', 'asset', [
    { id: 'c1', text: 'Buy ($400M)', cost: 400000000, outcomes: [{ weight: 1, text: 'You are now a king.', cashChange: -400000000, riskChange: 20 }] }
  ]);
  add(7, 't6_10', 'The Final Push', 'A risky leveraged buyout to hit $1B.', 'business', [
    { id: 'c1', text: 'Go All In ($500M)', cost: 500000000, outcomes: [
      { weight: 50, text: 'It paid off! Billionaire.', cashChange: 600000000, riskChange: 80 },
      { weight: 50, text: 'Margin called. Devastating loss.', cashChange: -490000000, riskChange: 90 }
    ]},
    { id: 'c2', text: 'Grind it out safely', cost: 0, outcomes: [{ weight: 1, text: 'Patience.', cashChange: 10000000, riskChange: -10 }] }
  ]);

  // Deliberate late-game liquidity decisions: neither choice is a disguised free win.
  add(6, 'liquidity_crossroads', 'Aurum Buyout Offer', 'Aurum Capital offers cash for your fastest-growing division.', 'business', [
    { id: 'sell', text: 'Sell for $35M now', cost: 0, outcomes: [{ weight: 1, text: 'You lock in a generational exit.', cashChange: 35_000_000, riskChange: -18 }] },
    { id: 'hold', text: 'Hold for another year', cost: 0, outcomes: [{ weight: 55, text: 'Growth compounds beyond the offer.', cashChange: 62_000_000, riskChange: 18 }, { weight: 45, text: 'A competitor erodes the division.', cashChange: -24_000_000, riskChange: 28 }] },
  ]);
  add(7, 'sovereign_sale_offer', 'Sovereign Sale Offer', 'A global consortium offers to acquire your flagship platform.', 'business', [
    { id: 'sell', text: 'Accept $420M cash', cost: 0, outcomes: [{ weight: 1, text: 'Wire confirmed. Liquidity secured.', cashChange: 420_000_000, riskChange: -25 }] },
    { id: 'hold', text: 'Reject and scale worldwide', cost: 0, outcomes: [{ weight: 48, text: 'The platform becomes indispensable.', cashChange: 720_000_000, riskChange: 30 }, { weight: 52, text: 'Regulators halt the expansion.', cashChange: -280_000_000, riskChange: 42 }] },
  ]);
  return [...scenarios, ...MONEY_EVENT_SCENARIOS];
};

export const SCENARIOS = generateScenarios();

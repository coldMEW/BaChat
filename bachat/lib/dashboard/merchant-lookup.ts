// ================================================================
// Tier-1 merchant → category lookup table
// ================================================================
// Every demo-seed merchant MUST appear here so the demo path hits
// Tier 1 100 % of the time (zero Claude calls during demo).
//
// Entry format: merchant name (normalized, lowercased) → category.
// We match on "contains" against the normalized description, so
// entries can be partial (e.g. 'doordash' matches 'DOORDASH*JOE PIZZA').

import { CATEGORY_DISCRETIONARY_WEIGHTS } from './score-calibration'
import type { TxCategory } from '@/types'

interface MerchantRow {
  // lowercased substring to match against the normalized description
  match: string
  merchant: string
  category: TxCategory
}

export const MERCHANT_TABLE: MerchantRow[] = [
  // delivery
  { match: 'doordash',     merchant: 'DoorDash',       category: 'delivery' },
  { match: 'ubereats',     merchant: 'Uber Eats',      category: 'delivery' },
  { match: 'uber eats',    merchant: 'Uber Eats',      category: 'delivery' },
  { match: 'grubhub',      merchant: 'Grubhub',        category: 'delivery' },
  { match: 'postmates',    merchant: 'Postmates',      category: 'delivery' },
  { match: 'instacart',    merchant: 'Instacart',      category: 'delivery' },
  { match: 'caviar',       merchant: 'Caviar',         category: 'delivery' },

  // ride-share
  { match: 'uber',         merchant: 'Uber',           category: 'ride-share' },
  { match: 'lyft',         merchant: 'Lyft',           category: 'ride-share' },

  // restaurants
  { match: 'chipotle',     merchant: 'Chipotle',       category: 'restaurants' },
  { match: 'sweetgreen',   merchant: 'Sweetgreen',     category: 'restaurants' },
  { match: 'shake shack',  merchant: 'Shake Shack',    category: 'restaurants' },
  { match: 'panera',       merchant: 'Panera Bread',   category: 'restaurants' },
  { match: 'mcdonald',     merchant: 'McDonalds',      category: 'restaurants' },
  { match: 'chick-fil',    merchant: 'Chick-fil-A',    category: 'restaurants' },
  { match: 'taco bell',    merchant: 'Taco Bell',      category: 'restaurants' },
  { match: 'subway',       merchant: 'Subway',         category: 'restaurants' },
  { match: 'olive garden', merchant: 'Olive Garden',   category: 'restaurants' },
  { match: 'cheesecake',   merchant: 'Cheesecake Factory', category: 'restaurants' },

  // coffee
  { match: 'starbucks',    merchant: 'Starbucks',      category: 'coffee' },
  { match: 'blue bottle',  merchant: 'Blue Bottle',    category: 'coffee' },
  { match: 'peet',         merchant: 'Peets Coffee',   category: 'coffee' },
  { match: 'philz',        merchant: 'Philz Coffee',   category: 'coffee' },
  { match: 'dunkin',       merchant: 'Dunkin',         category: 'coffee' },

  // groceries
  { match: 'whole foods',  merchant: 'Whole Foods',    category: 'groceries' },
  { match: 'trader joe',   merchant: 'Trader Joes',    category: 'groceries' },
  { match: 'safeway',      merchant: 'Safeway',        category: 'groceries' },
  { match: 'kroger',       merchant: 'Kroger',         category: 'groceries' },
  { match: 'costco',       merchant: 'Costco',         category: 'groceries' },
  { match: 'walmart',      merchant: 'Walmart',        category: 'groceries' },
  { match: 'target',       merchant: 'Target',         category: 'groceries' },
  { match: 'aldi',         merchant: 'Aldi',           category: 'groceries' },
  { match: 'publix',       merchant: 'Publix',         category: 'groceries' },

  // gas
  { match: 'chevron',      merchant: 'Chevron',        category: 'gas' },
  { match: 'shell',        merchant: 'Shell',          category: 'gas' },
  { match: 'exxon',        merchant: 'Exxon',          category: 'gas' },
  { match: 'bp ',          merchant: 'BP',             category: 'gas' },
  { match: '76 ',          merchant: '76 Gas',         category: 'gas' },

  // transit
  { match: 'mta',          merchant: 'MTA',            category: 'transit' },
  { match: 'bart',         merchant: 'BART',           category: 'transit' },
  { match: 'caltrain',     merchant: 'Caltrain',       category: 'transit' },
  { match: 'amtrak',       merchant: 'Amtrak',         category: 'transit' },

  // subscriptions + entertainment + streaming
  { match: 'netflix',      merchant: 'Netflix',        category: 'subscriptions' },
  { match: 'spotify',      merchant: 'Spotify',        category: 'subscriptions' },
  { match: 'apple.com/bill', merchant: 'Apple',        category: 'subscriptions' },
  { match: 'hulu',         merchant: 'Hulu',           category: 'subscriptions' },
  { match: 'disney+',      merchant: 'Disney+',        category: 'subscriptions' },
  { match: 'disney plus',  merchant: 'Disney+',        category: 'subscriptions' },
  { match: 'hbo',          merchant: 'HBO Max',        category: 'subscriptions' },
  { match: 'youtube premium', merchant: 'YouTube Premium', category: 'subscriptions' },
  { match: 'nytimes',      merchant: 'NYT',            category: 'subscriptions' },
  { match: 'patreon',      merchant: 'Patreon',        category: 'subscriptions' },
  { match: 'chatgpt',      merchant: 'OpenAI',         category: 'subscriptions' },

  // entertainment
  { match: 'amc theat',    merchant: 'AMC Theatres',   category: 'entertainment' },
  { match: 'regal',        merchant: 'Regal Cinemas',  category: 'entertainment' },
  { match: 'ticketmaster', merchant: 'Ticketmaster',   category: 'entertainment' },
  { match: 'stubhub',      merchant: 'StubHub',        category: 'entertainment' },
  { match: 'dave & buster', merchant: 'Dave & Busters', category: 'entertainment' },

  // fashion
  { match: 'shein',        merchant: 'Shein',          category: 'fashion' },
  { match: 'zara',         merchant: 'Zara',           category: 'fashion' },
  { match: 'h&m',          merchant: 'H&M',            category: 'fashion' },
  { match: 'uniqlo',       merchant: 'Uniqlo',         category: 'fashion' },
  { match: 'nordstrom',    merchant: 'Nordstrom',      category: 'fashion' },
  { match: 'macy',         merchant: 'Macys',          category: 'fashion' },
  { match: 'nike',         merchant: 'Nike',           category: 'fashion' },
  { match: 'adidas',       merchant: 'Adidas',         category: 'fashion' },
  { match: 'lululemon',    merchant: 'Lululemon',      category: 'fashion' },

  // electronics + hobbies
  { match: 'best buy',     merchant: 'Best Buy',       category: 'electronics' },
  { match: 'apple store',  merchant: 'Apple Store',    category: 'electronics' },
  { match: 'microcenter',  merchant: 'Micro Center',   category: 'electronics' },
  { match: 'steam',        merchant: 'Steam',          category: 'hobbies' },
  { match: 'playstation',  merchant: 'PlayStation Store', category: 'hobbies' },
  { match: 'nintendo',     merchant: 'Nintendo',       category: 'hobbies' },

  // fitness
  { match: 'equinox',      merchant: 'Equinox',        category: 'fitness' },
  { match: 'barry',        merchant: 'Barrys Bootcamp', category: 'fitness' },
  { match: 'soulcycle',    merchant: 'SoulCycle',      category: 'fitness' },
  { match: 'peloton',      merchant: 'Peloton',        category: 'fitness' },
  { match: "24 hour fitness", merchant: '24 Hour Fitness', category: 'fitness' },
  { match: 'planet fitness', merchant: 'Planet Fitness', category: 'fitness' },

  // home
  { match: 'ikea',         merchant: 'IKEA',           category: 'home' },
  { match: 'home depot',   merchant: 'Home Depot',     category: 'home' },
  { match: 'lowes',        merchant: 'Lowes',          category: 'home' },
  { match: 'west elm',     merchant: 'West Elm',       category: 'home' },
  { match: 'wayfair',      merchant: 'Wayfair',        category: 'home' },

  // broad-ranger — amazon needs special handling (could be anything)
  { match: 'amazon',       merchant: 'Amazon',         category: 'hobbies' },
  { match: 'amzn',         merchant: 'Amazon',         category: 'hobbies' },

  // travel
  { match: 'delta air',    merchant: 'Delta',          category: 'travel' },
  { match: 'united air',   merchant: 'United',         category: 'travel' },
  { match: 'american air', merchant: 'American Airlines', category: 'travel' },
  { match: 'southwest',    merchant: 'Southwest',      category: 'travel' },
  { match: 'airbnb',       merchant: 'Airbnb',         category: 'travel' },
  { match: 'booking.com',  merchant: 'Booking.com',    category: 'travel' },
  { match: 'marriott',     merchant: 'Marriott',       category: 'travel' },
  { match: 'hilton',       merchant: 'Hilton',         category: 'travel' },

  // utilities
  { match: 'pg&e',         merchant: 'PG&E',           category: 'utilities' },
  { match: 'con ed',       merchant: 'Con Edison',     category: 'utilities' },
  { match: 'comcast',      merchant: 'Comcast',        category: 'utilities' },
  { match: 'xfinity',      merchant: 'Xfinity',        category: 'utilities' },
  { match: 'verizon',      merchant: 'Verizon',        category: 'utilities' },
  { match: 't-mobile',     merchant: 'T-Mobile',       category: 'utilities' },
  { match: 'at&t',         merchant: 'AT&T',           category: 'utilities' },

  // rent
  { match: 'rent',         merchant: 'Rent',           category: 'rent' },
  { match: 'venmo rent',   merchant: 'Rent via Venmo', category: 'rent' },

  // healthcare
  { match: 'cvs',          merchant: 'CVS',            category: 'healthcare' },
  { match: 'walgreens',    merchant: 'Walgreens',      category: 'healthcare' },
  { match: 'rite aid',     merchant: 'Rite Aid',       category: 'healthcare' },

  // fees
  { match: 'atm fee',      merchant: 'ATM Fee',        category: 'fees' },
  { match: 'late fee',     merchant: 'Late Fee',       category: 'fees' },
  { match: 'overdraft',    merchant: 'Overdraft Fee',  category: 'fees' },

  // income / transfer
  { match: 'payroll',      merchant: 'Payroll',        category: 'income' },
  { match: 'direct dep',   merchant: 'Direct Deposit', category: 'income' },
  { match: 'venmo',        merchant: 'Venmo Transfer', category: 'transfer' },
  { match: 'zelle',        merchant: 'Zelle Transfer', category: 'transfer' },
]

/** Normalize a description/merchant for matching: lowercase, collapse whitespace. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

export interface CategorizedMerchant {
  merchant: string
  category: TxCategory
  discretionaryWeight: number
  source: 'lookup' | 'fallback'
}

/** Tier-1 lookup — returns null if no entry matches. */
export function lookupMerchant(description: string): CategorizedMerchant | null {
  const normed = normalize(description)
  for (const row of MERCHANT_TABLE) {
    if (normed.includes(row.match)) {
      return {
        merchant: row.merchant,
        category: row.category,
        discretionaryWeight: CATEGORY_DISCRETIONARY_WEIGHTS[row.category],
        source: 'lookup',
      }
    }
  }
  return null
}

/** Default fallback for unknown merchants (used when Tier 2 is disabled or fails). */
export function defaultFallback(description: string): CategorizedMerchant {
  const cleaned = description
    .replace(/[\d*#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40) || 'Unknown'
  return {
    merchant: cleaned,
    category: 'uncategorized',
    discretionaryWeight: CATEGORY_DISCRETIONARY_WEIGHTS.uncategorized,
    source: 'fallback',
  }
}

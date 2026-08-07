import { expect, Page, test } from '@playwright/test';

const manager = {
  id: 'manager-1',
  discordUserId: 'discord-1',
  username: 'manager',
  displayName: 'Manager',
  role: 'manager',
  approvalStatus: 'approved',
  accessStatus: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const agent = { ...manager, id: 'agent-1', username: 'agent', displayName: 'Agent', role: 'agent' };

const block = {
  id: 'block-1',
  blockId: 1,
  blockName: 'Central Block',
  numberOfProperties: 2,
  totalCost: 5000,
  totalRent: 7000,
  totalProfit: 2000,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const property = (id: string, status: 'available' | 'booked' | 'owned') => ({
  id,
  propertyId: status === 'available' ? 101 : status === 'booked' ? 102 : 103,
  blockId: block.id,
  blockName: block.blockName,
  propertyName:
    status === 'available' ? 'Available Home' : status === 'booked' ? 'Booked Home' : 'Owned Home',
  type: 'lowEndApartment',
  personCapacity: 2,
  stateCost: 2000,
  storageCapacity: 3750,
  rent: 0,
  status,
  amenities: [],
  images: [],
  isFeatured: false,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

async function authenticate(page: Page, user = manager) {
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: user }));
}

test('overview omits property creation and unavailable status', async ({ page }) => {
  await authenticate(page);
  await page.route('**/api/v1/settings/team', (route) =>
    route.fulfill({
      json: [
        {
          id: 'team-1',
          name: 'Maya Thorne',
          title: 'Managing Director',
          biography: 'Leads the estate team.',
          imageUrl: 'https://example.test/maya.jpg',
        },
      ],
    }),
  );
  await page.route('**/api/v1/tenants**', (route) =>
    route.fulfill({ json: { items: [], page: 1, pageSize: 100, totalCount: 0 } }),
  );
  await page.route('**/api/v1/dashboard', (route) =>
    route.fulfill({
      json: {
        totalBlocks: 1,
        totalProperties: 2,
        availableProperties: 1,
        bookedProperties: 0,
        occupiedProperties: 1,
        totalRevenue: 7000,
        totalCost: 5000,
        totalProfit: 2000,
        averageProfitPerProperty: 1000,
        mostProfitableBlock: 'Central Block',
        mostProfitableBlockProfit: 2000,
        pendingEnquiries: 0,
        pendingUsers: 0,
        recentStatusChanges: [],
      },
    }),
  );

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add property' })).toHaveCount(0);
  await expect(page.getByText('Unavailable', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Total revenue')).toBeVisible();
  await expect(page.getByText('Total cost')).toBeVisible();
  await expect(page.getByText('Total profit')).toBeVisible();
  await expect(page.getByText(/Rent − Cost/)).toBeVisible();
  await expect(page.getByText('Central Block')).toBeVisible();
  const breadcrumb = page.getByRole('navigation', { name: 'Dashboard breadcrumb' });
  await expect(breadcrumb.getByRole('link', { name: 'Overview' })).toHaveAttribute(
    'href',
    '/dashboard',
  );
  await expect(breadcrumb.getByRole('link', { name: 'Team' })).toHaveAttribute(
    'href',
    '/dashboard/team',
  );
  const navigation = page.getByRole('navigation', { name: 'Dashboard sections' });
  await expect(navigation.locator('.section-toggle').first()).toContainText('Auction');
  await expect(navigation.getByRole('button', { name: 'Portfolio' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(navigation.getByRole('button', { name: 'Administration' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(navigation.getByRole('button', { name: 'Auction' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(navigation.getByRole('button', { name: 'Notices' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(navigation.getByRole('link', { name: 'Listings' })).toHaveAttribute(
    'href',
    '/dashboard/auction/listings',
  );
  await expect(navigation.getByRole('link', { name: 'Overdue Notice' })).toHaveAttribute(
    'href',
    '/dashboard/notices/overdue',
  );
  await expect(navigation.getByRole('link', { name: 'Eviction Notice' })).toHaveAttribute(
    'href',
    '/dashboard/notices/eviction',
  );
  await expect(navigation.getByRole('link', { name: 'User Management' })).toBeVisible();
  await navigation.getByRole('button', { name: 'Administration' }).click();
  await expect(navigation.getByRole('link', { name: 'User Management' })).toHaveCount(0);
  await navigation.getByRole('button', { name: 'Administration' }).click();
  await expect(navigation.getByRole('link', { name: 'Enquiries' })).toHaveCount(0);
  await expect(page.getByText('New enquiries')).toHaveCount(0);

  await navigation.getByRole('link', { name: 'Listings' }).click();
  await expect(page).toHaveURL('/dashboard/auction/listings');
  await expect(page.getByRole('heading', { name: 'Listings' })).toBeVisible();

  await breadcrumb.getByRole('link', { name: 'Team' }).click();
  await expect(page).toHaveURL('/dashboard/team');
  await expect(page.getByRole('heading', { name: 'About the Team' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Maya Thorne' })).toBeVisible();

  await page.goto('/dashboard/tenants');
  await expect(page.getByRole('heading', { name: 'No tenancy records' })).toBeVisible();
  await expect(page.locator('app-empty-state svg.lucide-inbox')).toBeVisible();
});

test('theme can be changed and is remembered', async ({ page }) => {
  await authenticate(page);
  await page.route('**/api/v1/dashboard', (route) =>
    route.fulfill({
      json: {
        totalBlocks: 0,
        totalProperties: 0,
        availableProperties: 0,
        bookedProperties: 0,
        occupiedProperties: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        averageProfitPerProperty: 0,
        mostProfitableBlock: null,
        mostProfitableBlockProfit: 0,
        pendingEnquiries: 0,
        pendingUsers: 0,
        recentStatusChanges: [],
      },
    }),
  );

  await page.goto('/dashboard');
  await page.evaluate(() => localStorage.removeItem('imperial-estates-theme'));
  await page.reload();

  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect
    .poll(() =>
      page.evaluate(() => {
        const styles = getComputedStyle(document.documentElement);
        return {
          paper: styles.getPropertyValue('--paper').trim(),
          surface: styles.getPropertyValue('--surface').trim(),
          primary: styles.getPropertyValue('--forest').trim(),
          accent: styles.getPropertyValue('--bronze').trim(),
        };
      }),
    )
    .toEqual({
      paper: '#080908',
      surface: '#0f110e',
      primary: '#23e600',
      accent: '#a6ff3f',
    });

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
});

test('property actions follow available, booked, and occupied status', async ({ page }) => {
  await authenticate(page);
  await page.route('**/api/v1/blocks', (route) => route.fulfill({ json: [block] }));
  await page.route('**/api/v1/properties?**', (route) =>
    route.fulfill({
      json: {
        items: [
          property('available-1', 'available'),
          property('booked-1', 'booked'),
          property('owned-1', 'owned'),
        ],
        page: 1,
        pageSize: 20,
        totalItems: 3,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    }),
  );

  await page.goto('/dashboard/properties');
  const availableRow = page.getByRole('row').filter({ hasText: 'Available Home' });
  const bookedRow = page.getByRole('row').filter({ hasText: 'Booked Home' });
  const ownedRow = page.getByRole('row').filter({ hasText: 'Owned Home' });
  await expect(availableRow.getByRole('link', { name: 'Assign' })).toBeVisible();
  await expect(availableRow.getByRole('link', { name: 'Assign' })).toHaveAttribute(
    'href',
    '/dashboard/properties/available-1/assign',
  );
  await expect(availableRow.getByRole('button', { name: 'Book' })).toBeVisible();
  await expect(availableRow.getByRole('button', { name: 'Evict' })).toHaveCount(0);
  await expect(availableRow.getByRole('button', { name: 'Release' })).toHaveCount(0);
  await expect(bookedRow.getByRole('link', { name: 'Assign' })).toBeVisible();
  await expect(bookedRow.getByRole('button', { name: 'Book' })).toHaveCount(0);
  await expect(bookedRow.getByRole('button', { name: 'Release' })).toBeVisible();
  await expect(bookedRow.getByRole('button', { name: 'Evict' })).toHaveCount(0);
  await expect(ownedRow.getByRole('button', { name: 'Evict' })).toBeVisible();
  await expect(ownedRow.getByRole('link', { name: 'Assign' })).toHaveCount(0);
  await expect(ownedRow.getByRole('button', { name: 'Book' })).toHaveCount(0);
  for (const row of [availableRow, bookedRow, ownedRow]) {
    await expect(row.getByRole('link', { name: 'Manage' })).toHaveCount(0);
    await expect(row.getByRole('combobox')).toHaveCount(0);
    await expect(row.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(row.getByRole('link', { name: /^Edit / })).toBeVisible();
  }
  await expect(page.getByRole('option', { name: 'Unavailable' })).toHaveCount(0);

  await availableRow.getByRole('button', { name: 'Book' }).click();
  await expect(page.getByRole('heading', { name: 'Book this property?' })).toBeVisible();
  await expect(
    page.getByText('The property will be removed from public availability and marked as Booked.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await bookedRow.getByRole('button', { name: 'Release' }).click();
  await expect(page.getByRole('heading', { name: 'Release this property?' })).toBeVisible();
  await expect(
    page.getByText('The current booking will be removed and the property will become available.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
});

test('blocks show combined cost, rent, and profit', async ({ page }) => {
  await authenticate(page);
  await page.route('**/api/v1/blocks', (route) => route.fulfill({ json: [block] }));

  await page.goto('/dashboard/blocks');
  const row = page.getByRole('row').filter({ hasText: 'Central Block' });
  await expect(page.getByRole('columnheader', { name: 'Cost' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Rent' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Profit' })).toBeVisible();
  await expect(row).toContainText('$5,000');
  await expect(row).toContainText('$7,000');
  await expect(row).toContainText('$2,000');
});

test('tenant assignment requires CID, name, and phone without editing property fields', async ({
  page,
}) => {
  await authenticate(page);
  await page.route('**/api/v1/properties/available-1/manage', (route) =>
    route.fulfill({ json: property('available-1', 'available') }),
  );
  await page.route('**/api/v1/blocks', (route) => route.fulfill({ json: [block] }));
  await page.route('**/api/v1/properties?**', (route) =>
    route.fulfill({
      json: {
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    }),
  );

  let assignment: Record<string, unknown> | undefined;
  await page.route('**/api/v1/properties/available-1/assign-tenant', async (route) => {
    assignment = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: property('available-1', 'owned') });
  });

  await page.goto('/dashboard/properties/available-1/assign');
  await expect(page.getByRole('heading', { name: 'Assign tenant' })).toBeVisible();
  await expect(
    page.getByText('Property details are read-only during tenant assignment.'),
  ).toBeVisible();
  await expect(page.getByLabel('Property name')).toHaveCount(0);
  await expect(page.getByLabel('Block')).toHaveCount(0);
  await expect(page.getByLabel('Type')).toHaveCount(0);
  await expect(page.getByLabel('Email')).toHaveCount(0);

  const submit = page.getByRole('button', { name: 'Assign tenant' });
  await expect(submit).toBeDisabled();
  await page.getByLabel('Tenant full name').fill('Alex Mercer');
  await page.getByLabel('Phone number').fill('+1 555 0123');
  await expect(submit).toBeDisabled();
  await page.getByLabel('CID').fill('245');
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page).toHaveURL('/dashboard/properties');
  expect(assignment?.['cid']).toBe(245);
  expect(assignment?.['fullName']).toBe('Alex Mercer');
  expect(assignment?.['phoneNumber']).toBe('+1 555 0123');
  expect(assignment).not.toHaveProperty('email');
});

test('agents can assign but cannot access the property edit action', async ({ page }) => {
  await authenticate(page, agent);
  await page.route('**/api/v1/blocks', (route) => route.fulfill({ json: [block] }));
  await page.route('**/api/v1/properties?**', (route) =>
    route.fulfill({
      json: {
        items: [property('available-1', 'available')],
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    }),
  );

  await page.goto('/dashboard/properties');
  const row = page.getByRole('row').filter({ hasText: 'Available Home' });
  await expect(row.getByRole('link', { name: 'Assign' })).toBeVisible();
  await expect(row.getByRole('link', { name: /^Edit / })).toHaveCount(0);
  await expect(row.getByRole('button', { name: 'Delete' })).toHaveCount(0);
});

test('property search sends the entered search term and shows matching results', async ({
  page,
}) => {
  await authenticate(page);
  await page.route('**/api/v1/blocks', (route) => route.fulfill({ json: [block] }));
  let lastSearch = '';
  await page.route('**/api/v1/properties?**', (route) => {
    lastSearch = new URL(route.request().url()).searchParams.get('search') ?? '';
    const items = lastSearch ? [property('available-1', 'available')] : [];
    return route.fulfill({
      json: {
        items,
        page: 1,
        pageSize: 20,
        totalItems: items.length,
        totalPages: items.length,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });
  });

  await page.goto('/dashboard/properties');
  await page.getByLabel('Search properties').fill('Available Home');
  await expect.poll(() => lastSearch).toBe('Available Home');
  await expect(page.getByRole('row').filter({ hasText: 'Available Home' })).toBeVisible();
});

test('new property form omits pricing, dimensions, and amenities', async ({ page }) => {
  await authenticate(page);
  await page.route('**/api/v1/blocks', (route) => route.fulfill({ json: [block] }));

  await page.goto('/dashboard/properties/new');
  await expect(page.getByRole('heading', { name: 'Add a property' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pricing & dimensions' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Amenities' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Property images' })).toBeVisible();

  const type = page.getByLabel('Type');
  const blockSelect = page.getByLabel('Block');
  const [blockBox, typeBox] = await Promise.all([blockSelect.boundingBox(), type.boundingBox()]);
  expect(blockBox).not.toBeNull();
  expect(typeBox).not.toBeNull();
  expect(Math.abs(blockBox!.y - typeBox!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(blockBox!.height - typeBox!.height)).toBeLessThanOrEqual(1);
  await expect(type.getByRole('option')).toHaveText([
    'Motel',
    "Trevor's Trailer",
    'Janitor Apartment',
    'Low-End Apartment',
    "Lester's House",
    "Franklin's House",
    'Mid-End Apartment (House)',
    "Trevor's Beach House",
    "Michael's Mansion",
    "Franklin's Mansion",
    'High-End Apartment',
  ]);
  await expect(page.getByText('Capacity: 1 person')).toBeVisible();
  await type.selectOption('highEndApartment');
  await expect(page.getByText('Capacity: 5 people')).toBeVisible();
  await expect(type.getByRole('option', { name: 'Villa' })).toHaveCount(0);
});

test('creating a property confirms success and returns to the property list', async ({ page }) => {
  await authenticate(page);
  await page.route('**/api/v1/blocks', (route) => route.fulfill({ json: [block] }));
  await page.route('**/api/v1/properties?**', (route) =>
    route.fulfill({
      json: {
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    }),
  );
  await page.route('**/api/v1/properties', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await route.fulfill({
      json: {
        ...property('created-1', 'available'),
        propertyId: 501,
        propertyName: 'New Motel',
      },
    });
  });

  await page.goto('/dashboard/properties/new');
  await page.getByLabel('Property ID').fill('501');
  await page.getByLabel('Property name').fill('New Motel');
  await page.getByLabel('Block').selectOption(block.id);
  await page.getByRole('button', { name: 'Save property' }).click();

  await expect(page).toHaveURL('/dashboard/properties');
  await expect(page.getByText('Property created successfully.')).toBeVisible();
});

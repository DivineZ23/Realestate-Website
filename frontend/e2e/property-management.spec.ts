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

const block = {
  id: 'block-1',
  blockId: 1,
  blockName: 'Central Block',
  numberOfProperties: 2,
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
  type: 'apartment',
  rent: 0,
  status,
  amenities: [],
  images: [],
  isFeatured: false,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

async function authenticate(page: Page) {
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: manager }));
}

test('overview omits property creation and unavailable status', async ({ page }) => {
  await authenticate(page);
  await page.route('**/api/v1/dashboard', (route) =>
    route.fulfill({
      json: {
        totalBlocks: 1,
        totalProperties: 2,
        availableProperties: 1,
        bookedProperties: 0,
        occupiedProperties: 1,
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
  await expect(availableRow.getByRole('button', { name: 'Evict' })).toHaveCount(0);
  await expect(availableRow.getByRole('button', { name: 'Release' })).toHaveCount(0);
  await expect(bookedRow.getByRole('link', { name: 'Assign' })).toBeVisible();
  await expect(bookedRow.getByRole('button', { name: 'Release' })).toBeVisible();
  await expect(bookedRow.getByRole('button', { name: 'Evict' })).toHaveCount(0);
  await expect(ownedRow.getByRole('button', { name: 'Evict' })).toBeVisible();
  await expect(ownedRow.getByRole('link', { name: 'Assign' })).toHaveCount(0);
  for (const row of [availableRow, bookedRow, ownedRow]) {
    await expect(row.getByRole('link', { name: 'Manage' })).toHaveCount(0);
    await expect(row.getByRole('combobox')).toHaveCount(0);
    await expect(row.getByRole('button', { name: 'Delete' })).toBeVisible();
  }
  await expect(page.getByRole('option', { name: 'Unavailable' })).toHaveCount(0);

  await bookedRow.getByRole('button', { name: 'Release' }).click();
  await expect(page.getByRole('heading', { name: 'Release this property?' })).toBeVisible();
  await expect(
    page.getByText('The current booking will be removed and the property will become available.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
});

test('new property form omits pricing, dimensions, and amenities', async ({ page }) => {
  await authenticate(page);
  await page.route('**/api/v1/blocks', (route) => route.fulfill({ json: [block] }));

  await page.goto('/dashboard/properties/new');
  await expect(page.getByRole('heading', { name: 'Add a property' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pricing & dimensions' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Amenities' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Property images' })).toBeVisible();
});

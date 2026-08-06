import { expect, Page, test } from '@playwright/test';

const baseUser = {
  discordUserId: 'discord-user',
  avatarUrl: null,
  email: null,
  approvalStatus: 'approved',
  accessStatus: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const owner = {
  ...baseUser,
  id: 'owner-1',
  discordUserId: '336361433652527104',
  username: 'divine1337',
  displayName: 'Divine',
  role: 'owner',
};
const manager = {
  ...baseUser,
  id: 'manager-1',
  username: 'manager',
  displayName: 'Team Manager',
  role: 'manager',
};
const agent = {
  ...baseUser,
  id: 'agent-1',
  username: 'agent',
  displayName: 'Team Agent',
  role: 'agent',
};

async function setup(page: Page, currentUser = owner) {
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: currentUser }));
  await page.route('**/api/v1/users?**', (route) => {
    const query = new URL(route.request().url()).searchParams;
    const role = query.get('role');
    const items =
      role === 'owner' ? [owner] : role === 'manager' ? [manager] : role === 'agent' ? [agent] : [];
    return route.fulfill({
      json: {
        items,
        page: 1,
        pageSize: 100,
        totalItems: items.length,
        totalPages: items.length ? 1 : 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });
  });
}

test('owner is protected and can manage manager roles', async ({ page }) => {
  await setup(page);
  await page.goto('/dashboard/users');

  await page.getByRole('button', { name: 'Owner' }).click();
  const ownerCard = page.locator('article').filter({ hasText: '@divine1337' });
  await expect(ownerCard.getByText('Owner', { exact: true })).toBeVisible();
  await expect(ownerCard.getByRole('button', { name: 'Revoke' })).toHaveCount(0);
  await expect(ownerCard.getByRole('button', { name: 'Delete' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Managers' }).click();
  const managerCard = page.locator('article').filter({ hasText: '@manager' });
  await expect(managerCard.getByRole('button', { name: 'Demote' })).toBeVisible();
  await expect(managerCard.getByRole('button', { name: 'Revoke' })).toBeVisible();
  await expect(managerCard.getByRole('button', { name: 'Delete' })).toBeVisible();

  await page.getByRole('button', { name: 'Active agents' }).click();
  const agentCard = page.locator('article').filter({ hasText: '@agent' });
  await expect(agentCard.getByRole('button', { name: 'Promote to Manager' })).toBeVisible();
});

test('manager cannot grant manager role', async ({ page }) => {
  await setup(page, manager);
  await page.goto('/dashboard/users');
  await page.getByRole('button', { name: 'Active agents' }).click();
  const agentCard = page.locator('article').filter({ hasText: '@agent' });
  await expect(agentCard.getByRole('button', { name: 'Promote to Manager' })).toHaveCount(0);
  await expect(agentCard.getByRole('button', { name: 'Revoke' })).toBeVisible();
});

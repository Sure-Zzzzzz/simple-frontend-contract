import { expect, test } from '@playwright/test';

test('生产入口支持成功提交、错误反馈和恢复', async ({ page }) => {
  await page.goto('/');

  const input = page.getByLabel('示例输入');
  const submit = page.getByRole('button', { name: '提交' });

  await expect(page.getByRole('heading', { name: '前端应用模板' })).toBeVisible();
  await expect(input).not.toHaveAttribute('aria-describedby');
  await expect(input).not.toHaveAttribute('aria-invalid');

  await submit.click();

  const error = page.getByRole('alert');
  await expect(error).toHaveText('请输入内容。');
  await expect(input).toHaveAttribute('aria-describedby', 'input-error');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toBeFocused();

  await input.fill('内容');
  await submit.press('Enter');

  await expect(page.getByText('提交成功。')).toBeVisible();
  await expect(error).toHaveCount(0);
  await expect(input).not.toHaveAttribute('aria-describedby');
  await expect(input).not.toHaveAttribute('aria-invalid');
});

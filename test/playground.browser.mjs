import {test, expect} from '@playwright/test';
test('inline, sugerencia explícita, JSON y tabla',async({page})=>{
 await page.goto('/playground/');
 const input=page.getByLabel('Dirección de email');
 await input.fill('Ana+tag@gmial.com');
 await expect(input).not.toHaveAttribute('aria-invalid','true');
 await input.blur();
 await expect(page.getByText('¿Quisiste escribir Ana+tag@gmail.com?')).toBeVisible();
 await expect(input).toHaveValue('Ana+tag@gmial.com');
 await page.getByRole('button',{name:'Usar sugerencia'}).click();
 await expect(input).toHaveValue('Ana+tag@gmail.com');
 await input.fill('sin-arroba');await input.blur();
 await expect(input).toHaveAttribute('aria-invalid','true');
 await expect(page.locator('#json')).toContainText('"AT_SIGN"');
 await page.locator('#list').fill('ana@gmail.com\nana@gmial.com');
 await page.getByRole('button',{name:'Analizar lista'}).click();
 await expect(page.locator('#results tr')).toHaveCount(2);
});
test('modo enviar espera y descarte no cambia valor',async({page})=>{
 await page.goto('/playground/');await page.locator('#mode').selectOption('submit');
 const input=page.getByLabel('Dirección de email');await input.fill('ana@gmial.com');await input.blur();
 await expect(page.getByRole('button',{name:'Descartar'})).toBeHidden();
 await page.getByRole('button',{name:'Validar'}).click();
 await page.getByRole('button',{name:'Descartar'}).click();
 await expect(input).toHaveValue('ana@gmial.com');
});

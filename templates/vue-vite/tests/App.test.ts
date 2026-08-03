import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import App from '../src/App.vue';

describe('应用模板', () => {
  it('初始状态提供可访问输入名称且没有错误关联', () => {
    const wrapper = mount(App);
    const input = wrapper.get('input');

    expect(wrapper.get('h1').text()).toBe('前端应用模板');
    expect(input.attributes('aria-describedby')).toBeUndefined();
    expect(input.attributes('aria-invalid')).toBeUndefined();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('拒绝空白输入、关联错误并将焦点放回输入框', async () => {
    const wrapper = mount(App, { attachTo: document.body });
    const input = wrapper.get('input');

    await input.setValue('  ');
    await wrapper.get('button').trigger('click');

    expect(wrapper.get('[role="alert"]').text()).toBe('请输入内容。');
    expect(input.attributes('aria-describedby')).toBe('input-error');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(input.element);
    wrapper.unmount();
  });

  it('在错误后恢复有效输入并完成提交', async () => {
    const wrapper = mount(App);
    const input = wrapper.get('input');

    await wrapper.get('button').trigger('click');
    await input.setValue('内容');
    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).toContain('提交成功。');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(input.attributes('aria-describedby')).toBeUndefined();
    expect(input.attributes('aria-invalid')).toBeUndefined();
  });
});

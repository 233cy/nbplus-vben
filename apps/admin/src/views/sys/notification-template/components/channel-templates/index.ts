import DingTalkTemplate from './dingtalk.vue';
import EmailTemplate from './email.vue';
import GenericTemplate from './generic.vue';
import SmsTemplate from './sms.vue';
import StationTemplate from './station.vue';

export const channelTemplateComponentMap: Record<string, any> = {
  email: EmailTemplate,
  sms: SmsTemplate,
  station: StationTemplate,
  dingtalk: DingTalkTemplate,
};

export function getChannelTemplateComponent(driver?: string) {
  if (!driver) return GenericTemplate;
  return channelTemplateComponentMap[driver] || GenericTemplate;
}

export { DingTalkTemplate, EmailTemplate, GenericTemplate, SmsTemplate, StationTemplate };

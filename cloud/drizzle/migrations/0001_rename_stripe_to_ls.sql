ALTER TABLE `organization` RENAME COLUMN `stripe_customer_id` TO `ls_customer_id`;
ALTER TABLE `organization` RENAME COLUMN `stripe_subscription_id` TO `ls_subscription_id`;
ALTER TABLE `organization` RENAME COLUMN `stripe_price_id` TO `ls_variant_id`;

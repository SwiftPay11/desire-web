import AccountLayout from '@/components/account/AccountLayout';

export const metadata = {
  title: 'My Account | DESIRE',
  description:
    'Manage your DESIRE account, orders, addresses and preferences.',
};

export default function CustomerAccountLayout({
  children,
}) {
  return (
    <AccountLayout>
      {children}
    </AccountLayout>
  );
}
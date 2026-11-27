import { Crud } from '../../../components/Crud';

export default function Styles() {
  return (
    <Crud
      title="Style Management"
      path="/styles"
      filters={[{ key: 'searchTerm', label: 'Search style or buyer' }]}
      fields={[
        { key: 'buyer_name', label: 'Buyer name' },
        { key: 'style_no', label: 'Style number' },
        { key: 'smv', label: 'SMV', type: 'number' },
        { key: 'order_qty', label: 'Order quantity', type: 'number' },
      ]}
      columns={[
        { key: 'style_id', label: 'ID' },
        { key: 'style_no', label: 'Style' },
        { key: 'buyer_name', label: 'Buyer' },
        { key: 'smv', label: 'SMV' },
        { key: 'order_qty', label: 'Order' },
        { key: 'total_produced', label: 'Produced' },
        { key: 'remaining_qty', label: 'Remaining' },
      ]}
    />
  );
}

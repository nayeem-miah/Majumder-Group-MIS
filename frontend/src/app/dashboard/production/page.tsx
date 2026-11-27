'use client';

import { StyleCombobox } from '../../../components/StyleCombobox';
import { Crud } from '../../../components/Crud';

export default function Production() {
  return (
    <Crud
      title="Production Management"
      path="/production"
      filters={[
        { key: 'prod_date', label: 'Date', type: 'date' },
        { key: 'floor_no', label: 'Floor' },
        { key: 'line_no', label: 'Line' },
        { key: 'style_id', label: 'Style ID' },
      ]}
      fields={[
        { key: 'prod_date', label: 'Production date', type: 'date' },
        { key: 'floor_no', label: 'Floor number', type: 'number' },
        { key: 'line_no', label: 'Line number', type: 'number' },
        {
          key: 'style_id',
          label: 'Style',
          type: 'number',
          renderInput: (defaultValue) => (
            <StyleCombobox name="style_id" defaultValue={defaultValue} />
          ),
        },
        { key: 'operators_present', label: 'Operators present', type: 'number' },
        { key: 'working_minutes', label: 'Working minutes', type: 'number' },
        { key: 'output_qty', label: 'Output quantity', type: 'number' },
        { key: 'defect_qty', label: 'Defect quantity', type: 'number' },
      ]}
      columns={[
        { key: 'prod_id', label: 'ID' },
        { key: 'prod_date', label: 'Date' },
        { key: 'floor_no', label: 'Floor' },
        { key: 'line_no', label: 'Line' },
        { key: 'style_no', label: 'Style' },
        { key: 'output_qty', label: 'Output' },
        { key: 'defect_qty', label: 'Defects' },
        { key: 'efficiency', label: 'Efficiency', render: (v) => `${v}%` },
        { key: 'dhu', label: 'DHU', render: (v) => `${v}%` },
      ]}
    />
  );
}

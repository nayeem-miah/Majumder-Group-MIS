'use client';

import { Badge } from '../../../components/ui';
import { Crud } from '../../../components/Crud';

export default function Vehicles() {
  return (
    <Crud
      title="Vehicle Management"
      path="/vehicles"
      filters={[
        { key: 'searchTerm', label: 'Search registration' },
        {
          key: 'status',
          label: 'Status',
          options: ['Active', 'Under Maintenance'],
        },
      ]}
      fields={[
        { key: 'reg_no', label: 'Registration number' },
        { key: 'vehicle_type', label: 'Vehicle type' },
        { key: 'seat_capacity', label: 'Seat capacity', type: 'number' },
        {
          key: 'status',
          label: 'Status',
          options: ['Active', 'Under Maintenance'],
        },
      ]}
      columns={[
        { key: 'vehicle_id', label: 'ID' },
        { key: 'reg_no', label: 'Registration' },
        { key: 'vehicle_type', label: 'Type' },
        { key: 'seat_capacity', label: 'Seats' },
        {
          key: 'status',
          label: 'Status',
          render: (v) => (
            <Badge tone={v === 'Under Maintenance' ? 'warning' : 'success'}>
              {v}
            </Badge>
          ),
        },
      ]}
    />
  );
}

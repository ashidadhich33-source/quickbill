# QuickBill POS

A comprehensive, offline-first Point of Sale (POS) system for retail businesses handling 50,000+ items and 10,000+ customers with comprehensive billing, inventory, GST compliance, and CRM features.

## Features

### 🏪 **Point of Sale**
- Real-time barcode scanning
- Quick item search and selection
- Multiple payment modes (Cash, Card, UPI, Credit)
- Bill hold and recall functionality
- Keyboard shortcuts for fast operations
- Real-time GST calculations

### 📦 **Inventory Management**
- Complete item catalog management
- Stock tracking and alerts
- Category and subcategory organization
- Barcode and EAN code support
- Low stock and out-of-stock notifications
- CSV import/export functionality

### 👥 **Customer Management**
- Customer database with contact information
- Credit limit and balance tracking
- Loyalty points system
- Purchase history and analytics
- Customer children management
- Customer type classification (Retail/Wholesale)

### 📊 **Reports & Analytics**
- Daily, weekly, and monthly sales reports
- Top-selling items analysis
- Customer purchase patterns
- GST reports and compliance
- Inventory reports
- Export to PDF and Excel

### 🔧 **System Features**
- Offline-first architecture
- Automatic database backups
- Multi-terminal support
- User permissions and roles
- Audit trail logging
- Cross-platform compatibility

## Technology Stack

- **Platform**: Electron 28.x + Node.js 20.x LTS
- **Frontend**: React 18.x with TypeScript 5.x
- **Database**: SQLite 3.44.x with WAL mode
- **State Management**: Zustand 4.x
- **UI Framework**: Ant Design 5.x
- **Build Tool**: Vite 5.x
- **Packaging**: Electron-builder 24.x

## Installation

### Prerequisites

- Node.js 20.x or higher
- npm or yarn package manager

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/quickbill-team/quickbill-pos.git
cd quickbill-pos
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run electron:dev
```

### Building for Production

1. Build the application:
```bash
npm run electron:build
```

2. The built application will be available in the `dist` folder.

## Project Structure

```
quickbill-pos/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.ts
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   ├── queries/
│   │   │   └── backup.ts
│   │   ├── ipc/              # IPC handlers
│   │   │   ├── sales.handler.ts
│   │   │   ├── items.handler.ts
│   │   │   └── customers.handler.ts
│   │   └── utils/
│   │       ├── invoice.generator.ts
│   │       ├── barcode.scanner.ts
│   │       └── gst.calculator.ts
│   ├── renderer/             # React app
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── pos/
│   │   │   ├── inventory/
│   │   │   ├── customers/
│   │   │   └── reports/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── pos/
│   │   │   └── reports/
│   │   ├── hooks/
│   │   │   ├── useDatabase.ts
│   │   │   ├── useBarcode.ts
│   │   │   └── useKeyboard.ts
│   │   ├── store/
│   │   │   ├── pos.store.ts
│   │   │   └── app.store.ts
│   │   └── utils/
│   │       ├── validators.ts
│   │       └── formatters.ts
│   ├── shared/              # Shared types
│   │   └── types/
│   └── preload/
│       └── index.ts
├── resources/               # App resources
├── dist/                   # Build output
├── electron-builder.yml    # Build configuration
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Database Schema

The application uses SQLite with the following main tables:

- **items**: Product catalog with pricing, stock, and categorization
- **customers**: Customer information and credit management
- **sales**: Transaction records with invoice details
- **sales_items**: Individual items in each transaction
- **company_config**: Business configuration settings
- **user_permissions**: User access control
- **audit_log**: System activity logging

## Keyboard Shortcuts

- **F1**: Help
- **F2**: New Sale
- **F3**: Search Item
- **F4**: Search Customer
- **F5**: Apply Discount
- **F6**: Customer History
- **F7**: Hold Bill
- **F8**: Recall Bill
- **F9**: Payment
- **F10**: Save Bill
- **F11**: Fullscreen
- **F12**: Settings
- **Ctrl+P**: Print
- **Ctrl+N**: New Customer
- **Ctrl+R**: Sales Return
- **Escape**: Cancel Operation

## Performance Benchmarks

- **Database Size**: ~50-100MB for 50k items + 10k customers
- **RAM Usage**: 150-300MB
- **CPU Usage**: <5% idle, 10-15% during transactions
- **Startup Time**: <3 seconds
- **Item Search**: <50ms for 50k items
- **Invoice Generation**: <200ms
- **Report Generation**: <500ms for daily, <2s for monthly
- **Backup Time**: <5 seconds for full backup

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please contact:
- Email: support@quickbill.com
- Documentation: [docs.quickbill.com](https://docs.quickbill.com)
- Issues: [GitHub Issues](https://github.com/quickbill-team/quickbill-pos/issues)

## Changelog

### Version 1.0.0
- Initial release
- Complete POS functionality
- Inventory management
- Customer management
- Reports and analytics
- GST compliance
- Multi-platform support
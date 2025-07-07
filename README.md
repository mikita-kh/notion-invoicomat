# Notion InvoicOMat 🧾

## Technical Overview

**Notion InvoicOMat** is a microservice for automated PDF invoice generation from Notion pages with Slack integration and Firebase Storage. The system is built on NestJS with modular architecture and deployed as a Firebase Cloud Function.

### Key Features

- 🔄 **Automatic PDF generation** from Notion pages
- 💬 **Slack integration** for invoice generation triggers
- ☁️ **Firebase Storage** for PDF file storage
- 🌐 **Multi-language support** (i18n)
- 📊 **Currency conversion** with real-time exchange rates
- 🎨 **Customizable templates** with Tailwind CSS

## System Architecture

```mermaid
graph TB
    %% External services
    Slack[Slack Webhook]
    Notion[Notion API]
    Firebase[Firebase Storage]
    Exchange[Exchange Rate API]
    
    %% Application layers
    subgraph "Firebase Cloud Function"
        subgraph "NestJS Application"
            Controller[SlackController]
            
            subgraph "Core Services"
                SlackService[SlackService]
                InvoiceProcessor[InvoiceProcessorService]
                NotionService[NotionService]
                InvoiceRenderer[InvoiceRendererService]
                FirebaseStorage[FirebaseStorageService]
            end
            
            subgraph "Utility Services"
                HtmlToPdf[HtmlToPdfService]
                HtmlDocument[HtmlDocumentService]
                ExchangeService[ExchangeService]
                I18nService[I18nService]
            end
        end
    end
    
    %% Data flow
    Slack -->|Webhook Event| Controller
    Controller -->|Process Event| SlackService
    SlackService -->|Extract Page ID| InvoiceProcessor
    InvoiceProcessor -->|Get Data| NotionService
    NotionService -->|API Call| Notion
    InvoiceProcessor -->|Render PDF| InvoiceRenderer
    InvoiceRenderer -->|Exchange Rates| ExchangeService
    ExchangeService -->|API Call| Exchange
    InvoiceRenderer -->|Generate HTML| HtmlDocument
    InvoiceRenderer -->|Convert to PDF| HtmlToPdf
    InvoiceProcessor -->|Upload PDF| FirebaseStorage
    FirebaseStorage -->|Store File| Firebase
    InvoiceProcessor -->|Update with URL| NotionService
    NotionService -->|Update Page| Notion
    
    %% Styling
    classDef external fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef core fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef utility fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    
    class Slack,Notion,Firebase,Exchange external
    class SlackService,InvoiceProcessor,NotionService,InvoiceRenderer,FirebaseStorage core
    class HtmlToPdf,HtmlDocument,ExchangeService,I18nService utility
```

## Modular Architecture

### 1. 🚀 **Core Modules**

#### **InvoiceProcessorModule**
- **Purpose**: Orchestration of the entire invoice generation process
- **Responsibility**: Linear data processing pipeline
- **API**: `processInvoice(notionPageId: string)`

```typescript
// Linear invoice processing workflow
async process(notionPageId: string) {
  const invoiceData = await this.receiveInvoiceData(notionPageId)
  const pdfBuffer = await this.generateInvoicePdf(invoiceData)
  const fileUrl = await this.saveInvoicePdfToFirebase(pdfBuffer, invoiceData)
  await this.updateNotionPageInvoiceProperty(notionPageId, fileUrl)
}
```

#### **SlackModule**
- **Purpose**: Processing Slack webhook events
- **Responsibility**: Parsing Slack events and extracting Notion page ID
- **Integration**: Direct integration with `InvoiceProcessorService`

#### **NotionModule**
- **Purpose**: Notion API integration
- **Responsibility**: Retrieving and updating page data
- **Functions**: Data normalization, page property updates

#### **FirebaseModule**
- **Purpose**: Firebase services integration
- **Responsibility**: Firebase Admin SDK initialization, file storage
- **Architecture**: Singleton pattern for Firebase App instance

### 2. 🛠 **Utility Modules**

#### **InvoiceRendererModule**
- **Purpose**: HTML rendering and PDF conversion
- **Dependencies**: `HtmlDocumentService`, `HtmlToPdfService`, `ExchangeService`
- **Features**: Tailwind CSS support, dynamic currency conversion

#### **HtmlToPdfModule**
- **Purpose**: HTML to PDF conversion
- **Technology**: Puppeteer with optimized settings
- **Configuration**: A4 format, scaling, background images

#### **I18nModule**
- **Purpose**: Internationalization
- **Support**: English, Polish languages
- **Technology**: Custom i18n loader with nested keys support

### 3. 🔧 **Configuration & Infrastructure**

#### **ConfigModule**
- **Purpose**: Centralized configuration
- **Sources**: Environment variables, Firebase secrets
- **Validation**: Schema validation for critical parameters

## Technical Solutions and Benefits

### 🎯 **Refactoring from Pipeline to Service-based Architecture**

#### **Before (Pipeline):**
```typescript
// Complex pipeline architecture with abstract interfaces
interface InvoiceProcessorPipeline {
  process(context: ProcessingContext): Promise<ProcessingResult>
}
```

#### **After (Service-based):**
```typescript
// Explicit, linear API with clear responsibilities
class InvoiceProcessorService {
  async process(notionPageId: string): Promise<void>
  private async receiveInvoiceData(pageId: string): Promise<InvoiceData>
  private async generateInvoicePdf(invoiceData: InvoiceData): Promise<Buffer>
  private async saveInvoicePdfToFirebase(pdfBuffer: Buffer, invoiceData: InvoiceData): Promise<string>
  private async updateNotionPageInvoiceProperty(pageId: string, url: string): Promise<void>
}
```

### 📈 **Benefits of New Architecture:**

1. **Linearity and Readability**: Clear sequence of steps
2. **Fault Tolerance**: Each step has its own error handling
3. **Testability**: Each method can be tested independently
4. **Logging**: Detailed logs at each stage
5. **Performance**: No unnecessary abstractions

### 🔐 **Firebase Integration**

#### **New Firebase Architecture:**
```typescript
// Centralized Firebase initialization
@Module({
  providers: [FirebaseAdminService, FirebaseStorageService],
  exports: [FirebaseAdminService, FirebaseStorageService],
})
export class FirebaseModule implements OnModuleInit {
  onModuleInit() {
    this.firebaseAdminService.initializeFirebaseAdmin()
  }
}
```

**Benefits:**
- 🎯 **Singleton pattern** for Firebase App instance
- 🔒 **Secure initialization** through Admin SDK
- 📊 **Optimized Storage operations** through Buffer API
- 🏗️ **Modular structure** for reusability

### 🎨 **Template Engine & Styling**

- **Nunjucks** for dynamic HTML templates
- **Tailwind CSS** for modern styling
- **Responsive design** for correct PDF rendering
- **Dynamic content** with variable and loop support

## Project Structure

```
functions/
├── src/
│   ├── app/
│   │   ├── config/                    # Configuration module
│   │   ├── i18n/                      # Internationalization
│   │   │   └── locales/               # Language files
│   │   ├── invoice-processor/         # Core invoice processing
│   │   ├── invoice-renderer/          # PDF rendering
│   │   │   └── services/
│   │   │       └── templates/         # HTML templates
│   │   ├── notion/                    # Notion API integration
│   │   ├── slack/                     # Slack webhook handling
│   │   ├── firebase/                  # Firebase services
│   │   ├── html-to-pdf/               # PDF conversion
│   │   ├── html-document/             # HTML generation
│   │   └── exchange/                  # Currency exchange
│   └── index.ts                       # Firebase Function entry point
├── package.json
├── firebase.json
└── nest-cli.json
```

## Data Flow

### 1. **Slack Event Processing**
```
Slack Webhook → SlackController → SlackService → InvoiceProcessorService
```

### 2. **Invoice Generation Pipeline**
```
Notion Page ID → Retrieve Data → Generate HTML → Convert to PDF → Upload to Firebase → Update Notion
```

### 3. **Error Handling**
- Each service has its own logging
- Centralized error handling through NestJS
- Graceful failures with detailed error messages

## Deployment & Infrastructure

### **Firebase Cloud Functions**
- **Runtime**: Node.js 22
- **Trigger**: HTTPS webhook
- **Secrets**: Notion API key through Firebase Secrets
- **Memory**: Optimized for PDF generation
- **Timeout**: Extended for processing large documents

### **Environment Configuration**
```typescript
// Development vs Production
const isDevOrEmulator = process.env.NODE_ENV === 'development' || process.env.FUNCTIONS_EMULATOR === 'true'

// Conditional caching
...(isDevOrEmulator ? [CacheModule.register({ ttl: 3.6e6, isGlobal: true })] : [])
```

## API Endpoints

### **Slack Integration**
```
POST /slack/events
```
- **Purpose**: Handle Slack webhook events
- **Authentication**: Slack URL verification
- **Content-Type**: application/json

### **Testing Endpoints**
```
GET /
```
- **Purpose**: Health check
- **Response**: Simple HTML page

## Security Features

### 🔐 **Authentication & Authorization**
- **Slack**: URL verification through interceptor
- **Notion**: API key through Firebase Secrets
- **Firebase**: Admin SDK with service account

### 🛡️ **Input Validation**
- **Slack events**: Type validation through TypeScript interfaces
- **Notion data**: Schema validation for invoice data
- **File uploads**: Content-type validation

## Performance Optimizations

### 🚀 **Caching Strategy**
- **Development**: 1-hour TTL cache for API responses
- **Production**: No caching for real-time updates
- **Firebase**: Singleton pattern for App instance

### 📊 **PDF Generation**
- **Puppeteer**: Optimized for serverless environment
- **Buffer handling**: Efficient memory management
- **Tailwind CSS**: Purged CSS for minimal size

## Monitoring & Logging

### 📈 **Structured Logging**
```typescript
this.logger.debug('Invoice data retrieved', invoiceData)
this.logger.log('Invoice processing completed', result)
this.logger.error('Failed to process invoice', error)
```

### 🔍 **Error Tracking**
- **Firebase Functions**: Built-in error reporting
- **NestJS**: Centralized exception handling
- **Service-level**: Detailed error context

## Development Setup

### **Prerequisites**
- Node.js 22+
- Firebase CLI
- pnpm (package manager)

### **Local Development**
```bash
# Install dependencies
cd functions && pnpm install

# Start emulator
pnpm run serve

# Build for production
pnpm run build

# Deploy to Firebase
pnpm run deploy
```

### **Environment Variables**
```bash
# Required
NOTION_API_KEY=your_notion_api_key

# Optional
NODE_ENV=development
FUNCTIONS_EMULATOR=true
```

## Future Enhancements

### 🔮 **Planned Features**
1. **Email notifications** for invoice generation
2. **Webhook callbacks** for external systems
3. **Batch processing** for multiple invoices
4. **Custom templates** through Notion database
5. **Analytics dashboard** for generation tracking

### 🏗️ **Architecture Improvements**
1. **Queue system** for background processing
2. **Redis caching** for production
3. **Rate limiting** for API endpoints
4. **Health checks** for monitoring
5. **OpenAPI documentation** for API

---

## Technical Opinion

### 🎯 **Architectural Decisions**

**NestJS Choice** is justified for this project due to:
- Powerful dependency injection system
- Modular architecture out of the box
- Built-in support for decorators and middleware
- Excellent TypeScript support

**Service-based Architecture** vs Pipeline pattern:
- More predictable and linear code
- Easier testing and debugging
- Clear separation of responsibilities
- Better performance without unnecessary abstractions

**Firebase as Platform** provides:
- Serverless execution without infrastructure management
- Automatic scaling
- Integrated file storage
- Security through IAM and secrets

### 📊 **Performance Considerations**

1. **PDF Generation**: Puppeteer optimized for serverless through headless mode
2. **Memory Management**: Buffer API for efficient handling of large files
3. **Firebase Storage**: Direct upload without temporary files
4. **Caching**: Conditional caching for development/production

### 🔧 **Maintainability**

New architecture ensures:
- **Clear separation of concerns** between modules
- **Explicit dependencies** through dependency injection
- **Comprehensive logging** at every level
- **Type safety** through TypeScript interfaces
- **Testability** of each component separately

---

*Developed using modern architectural principles and best practices for enterprise-grade applications.*

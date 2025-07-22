import DOMPurify from 'dompurify';

// Phone number validation with international format support
export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 digits) or international (7-15 digits)
  if (digitsOnly.length === 10) {
    // US format
    const usPhoneRegex = /^[2-9]\d{2}[2-9]\d{2}\d{4}$/;
    if (!usPhoneRegex.test(digitsOnly)) {
      return { isValid: false, error: 'Invalid US phone number format' };
    }
  } else if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    // International format
    const intlPhoneRegex = /^\d{7,15}$/;
    if (!intlPhoneRegex.test(digitsOnly)) {
      return { isValid: false, error: 'Invalid international phone number format' };
    }
  } else {
    return { isValid: false, error: 'Phone number must be 10 digits (US) or 7-15 digits (international)' };
  }
  
  return { isValid: true };
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length === 10) {
    // US format: (555) 123-4567
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
  
  // For international numbers, just return with spaces every 3-4 digits
  if (digitsOnly.length > 10) {
    return digitsOnly.replace(/(\d{1,4})/g, '$1 ').trim();
  }
  
  return phone;
};

// Sanitize user input to prevent XSS attacks
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [] // Strip all attributes
  });
};

// Validate and sanitize alert message
export const validateAlertMessage = (message: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!message || message.trim().length === 0) {
    return { isValid: false, sanitized: '', error: 'Message cannot be empty' };
  }
  
  if (message.length > 1000) {
    return { isValid: false, sanitized: '', error: 'Message must be less than 1000 characters' };
  }
  
  // Sanitize the message
  const sanitized = sanitizeInput(message.trim());
  
  return { isValid: true, sanitized };
};

// Validate alert title
export const validateAlertTitle = (title: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!title || title.trim().length === 0) {
    return { isValid: false, sanitized: '', error: 'Title cannot be empty' };
  }
  
  if (title.length > 100) {
    return { isValid: false, sanitized: '', error: 'Title must be less than 100 characters' };
  }
  
  // Sanitize the title
  const sanitized = sanitizeInput(title.trim());
  
  return { isValid: true, sanitized };
};

// Rate limiting helper (client-side)
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests: number[] = [];
  
  return () => {
    const now = Date.now();
    
    // Remove old requests outside the window
    while (requests.length > 0 && requests[0] <= now - windowMs) {
      requests.shift();
    }
    
    // Check if we've exceeded the limit
    if (requests.length >= maxRequests) {
      return false;
    }
    
    // Add this request
    requests.push(now);
    return true;
  };
};
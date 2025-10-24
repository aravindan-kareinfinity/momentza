// Test script to verify URL-based organization resolution
// This file can be run in the browser console to test the implementation

import { organizationService } from './services/ServiceFactory';

export async function testOrganizationUrlResolution() {
  console.log('🧪 Testing URL-based organization resolution...');
  
  try {
    // Test 1: Get organization without ID (should use cached/current)
    console.log('\n📋 Test 1: Getting current organization without ID');
    const currentOrg = await organizationService.getCurrentOrganization();
    console.log('✅ Current organization:', currentOrg);
    
    // Test 2: Get organization with specific ID
    console.log('\n📋 Test 2: Getting organization with specific ID');
    const testOrgId = '123e4567-e89b-12d3-a456-426614174000'; // Example UUID
    try {
      const orgById = await organizationService.getCurrentOrganization(testOrgId);
      console.log('✅ Organization by ID:', orgById);
    } catch (error) {
      console.log('⚠️ Organization by ID not found (expected if ID doesn\'t exist):', error);
    }
    
    // Test 3: Test with empty string
    console.log('\n📋 Test 3: Getting organization with empty string');
    const orgEmpty = await organizationService.getCurrentOrganization('');
    console.log('✅ Organization with empty string (should fallback to current):', orgEmpty);
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test URL parameter extraction
export function testUrlParameterExtraction() {
  console.log('🧪 Testing URL parameter extraction...');
  
  // Simulate different URL scenarios
  const testUrls = [
    'http://192.168.1.13:8080/',
    'http://192.168.1.13:8080/org/123e4567-e89b-12d3-a456-426614174000',
    'http://192.168.1.13:8080/org/123e4567-e89b-12d3-a456-426614174000/',
    'http://192.168.1.13:8080/?orgId=123e4567-e89b-12d3-a456-426614174000',
    'http://192.168.1.13:8080/org/123e4567-e89b-12d3-a456-426614174000?other=param',
  ];
  
  testUrls.forEach((url, index) => {
    console.log(`\n📋 Test URL ${index + 1}: ${url}`);
    
    // Extract orgId from path
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const orgIdFromPath = pathParts[2] || null;
    
    // Extract orgId from search params
    const orgIdFromSearch = urlObj.searchParams.get('orgId');
    
    // Priority: path param > search param
    const finalOrgId = orgIdFromPath || orgIdFromSearch;
    
    console.log(`  - Path parts: [${pathParts.join(', ')}]`);
    console.log(`  - OrgId from path: ${orgIdFromPath}`);
    console.log(`  - OrgId from search: ${orgIdFromSearch}`);
    console.log(`  - Final orgId: ${finalOrgId}`);
  });
  
  console.log('\n🎉 URL parameter extraction tests completed!');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testOrganizationUrlResolution = testOrganizationUrlResolution;
  (window as any).testUrlParameterExtraction = testUrlParameterExtraction;
}

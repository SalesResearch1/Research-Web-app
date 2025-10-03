// Utility functions to interface with backend BLS and industry data functions

/**
 * Get environmental regulations applicable to a specific industry
 * Calls the backend getRegulationsForIndustry function
 */
export const getRegulationsForIndustry = async (industry) => {
    try {
        // This would call the deployed backend function
        // URL would be something like: https://your-app.base44.com/api/getRegulationsForIndustry
        const response = await fetch('/api/getRegulationsForIndustry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}` // or however auth is handled
            },
            body: JSON.stringify({ industry })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error fetching regulations for industry:', error);
        throw error;
    }
};

/**
 * Get industry benchmarks (TRIR/DART) for a specific industry or NAICS code
 * Calls the backend getIndustryBenchmarks function
 */
export const getIndustryBenchmarks = async (industry, naicsCode = null) => {
    try {
        // This would call the deployed backend function  
        // URL would be something like: https://your-app.base44.com/api/getIndustryBenchmarks
        const response = await fetch('/api/getIndustryBenchmarks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}` // or however auth is handled
            },
            body: JSON.stringify({ 
                industry, 
                naics_code: naicsCode 
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error fetching industry benchmarks:', error);
        throw error;
    }
};

/**
 * BLS Industry Benchmarks Data Structure
 * This represents the CSV data structure for BLS industry benchmarks:
 * Industry,NAICS_code,Average_TRIR,Average_DART
 */
export const BLS_DATA_STRUCTURE = {
    columns: ['Industry', 'NAICS_code', 'Average_TRIR', 'Average_DART'],
    description: 'Bureau of Labor Statistics industry benchmark data for TRIR and DART rates',
    example: {
        Industry: 'Manufacturing',
        NAICS_code: 31,
        Average_TRIR: 3.1,
        Average_DART: 1.8
    }
};

/**
 * Parse BLS benchmark CSV data into the required format
 * This would be used to process uploaded BLS data files
 */
export const parseBLSBenchmarkData = (csvData) => {
    try {
        // Split into lines and parse CSV
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        
        // Verify expected headers
        const expectedHeaders = ['Industry', 'NAICS_code', 'Average_TRIR', 'Average_DART'];
        const hasValidHeaders = expectedHeaders.every(header => headers.includes(header));
        
        if (!hasValidHeaders) {
            throw new Error('Invalid CSV format. Expected headers: ' + expectedHeaders.join(', '));
        }
        
        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',');
            const record = {
                Industry: values[0]?.trim(),
                NAICS_code: parseInt(values[1]?.trim()),
                Average_TRIR: parseFloat(values[2]?.trim()),
                Average_DART: parseFloat(values[3]?.trim())
            };
            
            // Only include valid records
            if (record.Industry && !isNaN(record.NAICS_code) && !isNaN(record.Average_TRIR)) {
                data.push(record);
            }
        }
        
        return {
            success: true,
            data: data,
            count: data.length
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
};
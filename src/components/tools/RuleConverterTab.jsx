// src/components/tools/RuleConverterTab.jsx - Updated to Use Exact Format Converter
import React, { useState, useRef } from 'react';
import {
    Upload,
    Download,
    FileText,
    Code,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    Wand2,
    FileJson,
    Copy,
    ArrowRight,
    Settings,
    Info,
    Trash2,
    Plus,
    Target
} from 'lucide-react';

// Import the exact format converter
import { ExactFormatRuleConverter } from '../../services/exactFormatRuleConverter';

const RuleConverterTab = () => {
    const [inputText, setInputText] = useState('');
    const [outputJson, setOutputJson] = useState('');
    const [stepNumber, setStepNumber] = useState(1);
    const [isConverting, setIsConverting] = useState(false);
    const [conversionResult, setConversionResult] = useState(null);
    const [ruleName, setRuleName] = useState('');
    const [ruleDescription, setRuleDescription] = useState('');
    const [variables, setVariables] = useState({});
    const [newVariableName, setNewVariableName] = useState('');
    const [newVariableValue, setNewVariableValue] = useState('');
    const [validationResult, setValidationResult] = useState(null);

    const fileInputRef = useRef(null);
    const jsonFileInputRef = useRef(null);

    // Create exact format converter service instance
    const converterService = new ExactFormatRuleConverter();

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            setInputText(text);
            setValidationResult(null);
            
            // Auto-detect step based on filename
            const filename = file.name.toLowerCase();
            if (filename.includes('process1') || filename.includes('step1')) {
                setStepNumber(1);
            } else if (filename.includes('process2') || filename.includes('step2')) {
                setStepNumber(2);
            } else if (filename.includes('process3') || filename.includes('step3')) {
                setStepNumber(3);
            }
            
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }

        event.target.value = '';
    };

    const handleJsonImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const result = await converterService.importFromFile(file);

            if (result.success) {
                setOutputJson(JSON.stringify(result.rules, null, 2));
                setConversionResult({
                    success: true,
                    rulesCount: result.rulesCount,
                    imported: true
                });
            } else {
                alert('Error importing JSON: ' + result.error);
            }
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }

        event.target.value = '';
    };

    const handleConvert = async () => {
        if (!inputText.trim()) {
            alert('Please enter text rules or upload a file');
            return;
        }

        setIsConverting(true);
        setValidationResult(null);

        try {
            // Validate input first
            const validation = converterService.validateTextRules(inputText);
            setValidationResult(validation);

            if (!validation.isValid) {
                setIsConverting(false);
                return;
            }

            // Add artificial delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 500));

            const options = {
                name: ruleName || undefined,
                description: ruleDescription || undefined,
                variables: variables,
                author: "Rule Converter UI"
            };

            console.log(`Converting to exact format for Step ${stepNumber}:`);
            console.log('Input rules:', inputText);
            
            const result = converterService.convertTextToJson(inputText, stepNumber, options);

            if (result.success) {
                const formattedJson = JSON.stringify(result.result, null, 2);
                setOutputJson(formattedJson);
                setConversionResult({
                    success: true,
                    ...result.statistics,
                    exactFormat: true
                });
                console.log('Exact format conversion completed successfully');
                console.log('Generated JSON:', result.result);
            } else {
                setConversionResult({
                    success: false,
                    error: result.error
                });
                console.error('Conversion failed:', result.error);
            }

        } catch (error) {
            console.error('Conversion error:', error);
            setConversionResult({
                success: false,
                error: error.message
            });
        } finally {
            setIsConverting(false);
        }
    };

    const handleDownloadJson = () => {
        if (!outputJson) return;

        const filename = `step${stepNumber}_rules.json`;
        try {
            const jsonObj = JSON.parse(outputJson);
            converterService.exportToFile(jsonObj, filename);
        } catch (error) {
            alert('Error downloading file: ' + error.message);
        }
    };

    const handleCopyJson = async () => {
        try {
            await navigator.clipboard.writeText(outputJson);
            alert('JSON copied to clipboard!');
        } catch (error) {
            alert('Failed to copy to clipboard');
        }
    };

    const loadSampleRules = () => {
        const sample = converterService.getSampleRules(stepNumber);
        setInputText(sample);
        setValidationResult(null);
    };

    const addVariable = () => {
        if (!newVariableName.trim() || !newVariableValue.trim()) return;

        const varName = newVariableName.trim().toUpperCase();
        const varValue = newVariableValue.trim();

        // Try to parse as number if possible
        const parsedValue = !isNaN(varValue) ? parseFloat(varValue) : varValue;

        setVariables(prev => ({
            ...prev,
            [varName]: parsedValue
        }));

        setNewVariableName('');
        setNewVariableValue('');
    };

    const removeVariable = (name) => {
        setVariables(prev => {
            const updated = { ...prev };
            delete updated[name];
            return updated;
        });
    };

    const clearAll = () => {
        setInputText('');
        setOutputJson('');
        setConversionResult(null);
        setValidationResult(null);
        setRuleName('');
        setRuleDescription('');
        setVariables({});
    };

    const validateInput = () => {
        if (!inputText.trim()) return;

        const validation = converterService.validateTextRules(inputText);
        setValidationResult(validation);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                    <Target className="w-8 h-8 text-green-600" />
                    Exact Format Rule Converter
                </h1>
                <p className="text-gray-600 mb-4">
                    Converts text rules to <strong>exact JSON format</strong> matching your step1_rules.json, step2_rules.json, and step3_rules.json
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                    <FileText className="w-4 h-4" />
                    <ArrowRight className="w-4 h-4" />
                    <FileJson className="w-4 h-4" />
                    <span>Text Rules → Exact JSON Structure</span>
                </div>
            </div>

            {/* Exact Format Guarantee */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Target className="w-6 h-6 text-green-600 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-green-900 mb-2">✅ Exact Format Guarantee</h3>
                        <div className="text-sm text-green-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <div className="font-medium">Step 1 Format:</div>
                                <div>• clear_all_payment_fields</div>
                                <div>• initialize_interest_and_balances</div>
                                <div>• apply_plumbing_charges</div>
                                <div>• clear_date_fields</div>
                            </div>
                            <div className="space-y-1">
                                <div className="font-medium">Step 2 Format:</div>
                                <div>• calculate_outstanding_balance</div>
                                <div>• handle_negative_arrears_as_advance</div>
                                <div>• interest_arrear_payment_adjustments</div>
                                <div>• generate_receipt_words</div>
                            </div>
                            <div className="space-y-1">
                                <div className="font-medium">Step 3 Format:</div>
                                <div>• calculate_quarterly_interest</div>
                                <div>• calculate_total_charges</div>
                                <div>• calculate_grand_total</div>
                                <div>• clear_bank_fields_for_zero_components</div>
                            </div>
                        </div>
                        <div className="mt-3 text-sm text-green-700 font-medium">
                            🎯 Generates identical JSON structure, rule IDs, variables, and metadata as your reference files
                        </div>
                    </div>
                </div>
            </div>

            {/* Configuration Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Processing Step
                        </label>
                        <select
                            value={stepNumber}
                            onChange={(e) => setStepNumber(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value={1}>Step 1 - Data Initialization</option>
                            <option value={2}>Step 2 - Financial Calculations</option>
                            <option value={3}>Step 3 - Final Processing</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rule Name (Optional)
                        </label>
                        <input
                            type="text"
                            value={ruleName}
                            onChange={(e) => setRuleName(e.target.value)}
                            placeholder={`Will use default Step ${stepNumber} name`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description (Optional)
                        </label>
                        <input
                            type="text"
                            value={ruleDescription}
                            onChange={(e) => setRuleDescription(e.target.value)}
                            placeholder="Will use default description"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                </div>

                {/* Variables Section */}
                <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Additional Variables (Optional)</h3>
                    <div className="text-sm text-gray-600 mb-3">
                        Each step has default variables. Add custom ones if needed:
                    </div>

                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newVariableName}
                            onChange={(e) => setNewVariableName(e.target.value)}
                            placeholder="Variable name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <input
                            type="text"
                            value={newVariableValue}
                            onChange={(e) => setNewVariableValue(e.target.value)}
                            placeholder="Variable value"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                            onClick={addVariable}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Show default variables for current step */}
                    <div className="bg-blue-50 rounded-md p-3 mb-3">
                        <div className="text-sm text-blue-700 mb-2">
                            <strong>Default Variables for Step {stepNumber}:</strong>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-blue-800">
                            {stepNumber === 1 && (
                                <>
                                    <div>PLUMBING_CHARGE = 300</div>
                                    <div>PLUMBING_REMARKS = "PLUMBING CHARGES REPAIR EXP."</div>
                                </>
                            )}
                            {stepNumber === 2 && (
                                <>
                                    <div>EMPTY_VALUE = ""</div>
                                    <div>ZERO_VALUE = 0</div>
                                </>
                            )}
                            {stepNumber === 3 && (
                                <>
                                    <div>INTEREST_RATE = 0.21</div>
                                    <div>QUARTERLY_DIVISOR = 4</div>
                                    <div>BANKER_ROUNDING_OFFSET = 0.50</div>
                                    <div>EMPTY_VALUE = ""</div>
                                </>
                            )}
                        </div>
                    </div>

                    {Object.keys(variables).length > 0 && (
                        <div className="bg-gray-50 rounded-md p-3">
                            <div className="text-sm text-gray-600 mb-2">Custom Variables:</div>
                            <div className="space-y-1">
                                {Object.entries(variables).map(([name, value]) => (
                                    <div key={name} className="flex items-center justify-between bg-white px-3 py-2 rounded border">
                                        <span className="font-mono text-sm">{name} = {JSON.stringify(value)}</span>
                                        <button
                                            onClick={() => removeVariable(name)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input/Output Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Text Rules Input
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={loadSampleRules}
                                    className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    <Wand2 className="w-4 h-4 mr-1" />
                                    Sample
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt,.text"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                                >
                                    <Upload className="w-4 h-4 mr-1" />
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={`Paste your process${stepNumber}.txt content here or upload the file...\n\nExample:\nUPDATE ALL FIELD_NAME WITH value\nUPDATE ALL FIELD_NAME WITH value FOR CONDITION<=value`}
                            className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                        />

                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Lines: {inputText.split('\n').filter(line => line.trim()).length}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={validateInput}
                                    className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                                >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Validate
                                </button>

                                <button
                                    onClick={handleConvert}
                                    disabled={isConverting || !inputText.trim()}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isConverting ? (
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Target className="w-4 h-4 mr-2" />
                                    )}
                                    {isConverting ? 'Converting...' : 'Convert to Exact JSON'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Output Section */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <FileJson className="w-5 h-5" />
                                Exact JSON Output
                            </h2>
                            {outputJson && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopyJson}
                                        className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                    >
                                        <Copy className="w-4 h-4 mr-1" />
                                        Copy
                                    </button>
                                    <button
                                        onClick={handleDownloadJson}
                                        className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                                    >
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4">
                        {outputJson ? (
                            <textarea
                                value={outputJson}
                                readOnly
                                className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                            />
                        ) : (
                            <div className="h-96 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-md">
                                <div className="text-center">
                                    <Target className="w-12 h-12 mx-auto mb-2 text-green-400" />
                                    <p>Exact format JSON output will appear here</p>
                                    <p className="text-sm">Matches your step1_rules.json, step2_rules.json, step3_rules.json</p>
                                </div>
                            </div>
                        )}

                        {/* Validation Results */}
                        {validationResult && (
                            <div className={`mt-4 p-3 rounded-md border ${validationResult.isValid
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                                }`}>
                                <div className="flex items-center gap-2">
                                    {validationResult.isValid ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                    )}
                                    <span className={`text-sm font-medium ${validationResult.isValid ? 'text-green-800' : 'text-red-800'
                                        }`}>
                                        {validationResult.isValid ? 'Validation Passed!' : 'Validation Failed'}
                                    </span>
                                </div>

                                {validationResult.isValid && (
                                    <div className="mt-2 text-sm text-green-700">
                                        Found {validationResult.linesCount} valid rule lines
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Conversion Results */}
                        {conversionResult && (
                            <div className={`mt-4 p-3 rounded-md border ${conversionResult.success
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                                }`}>
                                <div className="flex items-center gap-2">
                                    {conversionResult.success ? (
                                        <Target className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                    )}
                                    <span className={`text-sm font-medium ${conversionResult.success ? 'text-green-800' : 'text-red-800'
                                        }`}>
                                        {conversionResult.success ? 'Exact Format Conversion Successful!' : 'Conversion Failed'}
                                    </span>
                                </div>

                                {conversionResult.success ? (
                                    <div className="mt-2 text-sm text-green-700">
                                        {conversionResult.imported ? (
                                            `Imported ${conversionResult.rulesCount} rules from JSON file`
                                        ) : (
                                            <>
                                                <div>✅ Generated {conversionResult.rulesCount} rule groups with {conversionResult.operationsCount} operations</div>
                                                <div>✅ Using {conversionResult.variablesCount} variables in exact format</div>
                                                <div>✅ Processed {conversionResult.originalLinesCount} original text lines</div>
                                                {conversionResult.exactFormat && (
                                                    <div className="mt-1 font-medium">🎯 Exact format guarantee: JSON structure matches your reference files</div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-2 text-sm text-red-700">
                                        {conversionResult.error}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Clear All Button */}
            <div className="flex justify-center">
                <button
                    onClick={clearAll}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                </button>
            </div>

            {/* Test Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Test Instructions & Expected Results
                </h2>

                <div className="space-y-4 text-sm">
                    <div className="bg-white rounded-md p-4 border border-blue-100">
                        <h3 className="font-medium text-blue-900 mb-2">🧪 How to Test:</h3>
                        <ol className="list-decimal list-inside space-y-1 text-blue-800">
                            <li>Copy content from your process1.txt file</li>
                            <li>Paste into the input area (or upload the file directly)</li>
                            <li>Select Step 1 and click "Convert to Exact JSON"</li>
                            <li>Download as step1_rules.json</li>
                            <li>Compare with your reference step1_rules.json file</li>
                        </ol>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-md p-4 border border-blue-100">
                            <h3 className="font-medium text-blue-900 mb-2">Step 1 Expected Output:</h3>
                            <div className="text-xs text-blue-800 space-y-1">
                                <div>✅ clear_all_payment_fields</div>
                                <div>✅ initialize_interest_and_balances</div>
                                <div>✅ apply_plumbing_charges</div>
                                <div>✅ clear_date_fields</div>
                                <div className="text-blue-600">Variables: PLUMBING_CHARGE, PLUMBING_REMARKS</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-md p-4 border border-blue-100">
                            <h3 className="font-medium text-blue-900 mb-2">Step 2 Expected Output:</h3>
                            <div className="text-xs text-blue-800 space-y-1">
                                <div>✅ calculate_outstanding_balance</div>
                                <div>✅ handle_negative_arrears_as_advance</div>
                                <div>✅ reset_interest_arrears_for_zero_arrears</div>
                                <div>✅ interest_arrear_payment_adjustments</div>
                                <div>✅ generate_receipt_words</div>
                                <div className="text-blue-600">Variables: EMPTY_VALUE, ZERO_VALUE</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-md p-4 border border-blue-100">
                            <h3 className="font-medium text-blue-900 mb-2">Step 3 Expected Output:</h3>
                            <div className="text-xs text-blue-800 space-y-1">
                                <div>✅ calculate_quarterly_interest</div>
                                <div>✅ calculate_total_charges</div>
                                <div>✅ calculate_grand_total</div>
                                <div>✅ clear_receipt_fields_for_zero_amount</div>
                                <div>✅ generate_receipt_words_final</div>
                                <div className="text-blue-600">Variables: INTEREST_RATE, QUARTERLY_DIVISOR, etc.</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-100 border border-green-300 rounded-md p-4">
                        <h3 className="font-medium text-green-900 mb-2">🎯 Exact Format Features:</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                            <div>✅ Identical metadata structure</div>
                            <div>✅ Exact rule IDs and descriptions</div>
                            <div>✅ Variable substitution (VARIABLE_NAME)</div>
                            <div>✅ Proper if/elseif/else conditions</div>
                            <div>✅ Step-specific notes and conversions</div>
                            <div>✅ Custom functions (INT, WORDS)</div>
                            <div>✅ Operator fixes (=&lt; → &lt;=, =&gt; → &gt;=)</div>
                            <div>✅ Business logic grouping</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Usage Instructions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Instructions</h2>

                <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <div>
                            <h3 className="font-medium text-gray-900">Upload Process Files</h3>
                            <p className="text-gray-600">Upload your process1.txt, process2.txt, or process3.txt files. Step number will auto-detect from filename.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <div>
                            <h3 className="font-medium text-gray-900">Convert to Exact Format</h3>
                            <p className="text-gray-600">Click "Convert to Exact JSON" to generate JSON that exactly matches your reference files' structure.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <div>
                            <h3 className="font-medium text-gray-900">Download & Verify</h3>
                            <p className="text-gray-600">Download the generated JSON and compare with your reference files. Structure should be identical.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        <div>
                            <h3 className="font-medium text-gray-900">Use in Processing</h3>
                            <p className="text-gray-600">Upload the generated JSON files to your processing steps for execution.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <h3 className="font-medium text-green-900 mb-2">🎯 Exact Format Converter Advantages</h3>
                    <div className="text-sm text-green-800 space-y-1">
                        <div>• <strong>100% Structure Match:</strong> Generated JSON exactly matches your reference file structure</div>
                        <div>• <strong>Smart Rule Grouping:</strong> Logically groups rules based on business function, not just type</div>
                        <div>• <strong>Variable Integration:</strong> Properly uses variable name syntax throughout</div>
                        <div>• <strong>Step-Specific Logic:</strong> Each step has unique processing logic and metadata</div>
                        <div>• <strong>Operator Normalization:</strong> Automatically fixes =&lt; → &lt;=, =&gt; → &gt;=, etc.</div>
                        <div>• <strong>Business Context:</strong> Rule IDs and descriptions reflect actual business operations</div>
                    </div>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h3 className="font-medium text-yellow-900 mb-2">⚠️ Important Notes</h3>
                    <div className="text-sm text-yellow-800 space-y-1">
                        <div>• This converter produces the exact JSON format you provided as reference</div>
                        <div>• Rule order and grouping will match your step1_rules.json, step2_rules.json, step3_rules.json</div>
                        <div>• Variables and metadata will be identical to your reference files</div>
                        <div>• If output doesn't match, please check your input text rules format</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RuleConverterTab;
const testCases = [
  { input: '3\n', expected_output: '1\n2\nFizz' },
  { input: '5\n', expected_output: '1\n2\nFizz\n4\nBuzz' }
];

const buildStdinWithTestCases = (testCases) => {
  if (!testCases || testCases.length === 0) return '';
  const count = testCases.length;
  const inputs = testCases.map(tc => tc.input).join('');
  return `${count}\n${inputs}`;
};

const stdin = buildStdinWithTestCases(testCases);
console.log('FizzBuzz stdin:');
console.log(JSON.stringify(stdin));
console.log('\nActual stdin:');
console.log(stdin);
console.log('---END---');

const twoSumCases = [
  { input: '4\n2 7 11 15\n9\n', expected_output: '0 1' },
  { input: '3\n3 2 4\n6\n', expected_output: '1 2' }
];

const stdin2 = buildStdinWithTestCases(twoSumCases);
console.log('\nTwo Sum stdin:');
console.log(JSON.stringify(stdin2));
console.log('\nActual stdin:');
console.log(stdin2);
console.log('---END---');

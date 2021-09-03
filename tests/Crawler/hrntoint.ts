import { strict as assert } from 'assert';
import { getVideoInfo, openForYouPage, getForYouVideoUrls, HRNToInt, publishDate } from '../../src/Crawler/Actions/Tiktok';

const test1 = () => {
  assert.deepEqual(10000, HRNToInt("10K"));
  assert.deepEqual(10500, HRNToInt("10.5K"));
  assert.deepEqual(10500000, HRNToInt("10.5M"));
  assert.deepEqual(1050, HRNToInt("1050"));
  assert.deepEqual(1000000000, HRNToInt("1B"));
  assert.deepEqual(31000, HRNToInt("31K"));
}

const getISOString = (date: Date) => {
  return date.toISOString().split('T')[0];
}

const testHumanDate = () => {
  const daysAgo3 = new Date();
  daysAgo3.setDate(-3);

  const weekAgo = new Date();
  weekAgo.setDate(-7);

  const weekAgo3 = new Date();
  weekAgo3.setDate(-(7*3));

  assert.deepEqual(getISOString(publishDate("3d atrás")), getISOString(daysAgo3));
  assert.deepEqual(getISOString(publishDate("1w atrás")), getISOString(weekAgo));
  assert.deepEqual(getISOString(publishDate("3w atrás")), getISOString(weekAgo3));

}

test1();
testHumanDate();
console.log("Tests passed");


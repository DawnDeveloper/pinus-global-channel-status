
import  'jest';
import RedisManager from '../lib/manager/RedisGlobalChannelManager';
const config = require('./config/redisConfig').redisChannel;

// const test = require('ava').test;

const app:any = {
    getServersByType(){}
};
const redisManager = new RedisManager(app, config);

const serverType = 'connector';
const serverId = ['connector_1', 'connector_2', 'connector_3'];
const serverData = [{id: 'connector_1'}, {id: 'connector_2'}, {id: 'connector_3'}];
const channelName = ['channelName1', 'channelName2', 'channelName3'];

class Test
{

    static async before()
    {
        await redisManager.start();
        await redisManager.clean();
    }

    static async after()
    {
     //   await redisManager.clean();
        await redisManager.stop();
    }

    static async add()
    {
        const coArr = [];
        for (let i = 0; i < 30; i++)
        {
            const index = Test.random(0, serverId.length - 1);
            coArr.push(redisManager.add(`uuid_${i}`, serverId[index], channelName[i%3]));
        }
        const result = await Promise.all(coArr);
        console.info('test.add',JSON.stringify(result));
    }


    static random(min, max)
    {
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    static async leave()
    {
        const coArr = [];
        for (const id of serverId)
        {
            coArr.push(redisManager.leave('uuid_1', id, channelName));
        }
        const result = await Promise.all(coArr);
        console.info('test.leave',result);
    }


    static async addNoChannel()
    {
        const coArr = [];
        for (let i = 0; i < 10; i++)
        {
            const index = Test.random(0, serverId.length - 1);
            coArr.push(redisManager.add(`uuid_${i}`, serverId[index]));
        }
        const result = await Promise.all(coArr);
        console.info('test.addNoChannel',result);
    }





    static async leaveNoChannel()
    {
        const coArr = [];
        for (const id of serverId)
        {
            coArr.push(redisManager.leave('uuid_3', id));
        }
        const result = await Promise.all(coArr);
        console.info('leaveNoChannel',result);
    }

    static async test()
    {
        await Test.before();
        await Test.add();
        await Test.leave();
        await Test.addNoChannel();
        await Test.after();
    }

    static async globalService()
    {
        await Test.before();
        await Test.addNoChannel();
        await Test.leaveNoChannel();
        await Test.after();
    }
}
//Test.test();
// Test.globalService();

describe('test channel',()=>{
    beforeAll(async ()=>{
        await Test.before();
        await Test.add();
    });

    afterAll(async ()=>{
        console.log('clean test data');
        await Test.after();
    });

    test('test globalService',async ()=>{
        await Test.addNoChannel();
        const members = await redisManager.getSidsByUid('uuid_3');
        console.info('test.getSidsByUid',members);

        const c1members = await redisManager.getSidsByUidArr(['uuid_10', 'uuid_3', 'uuid_0']);
        console.info('test.getSidsByUidArr c1members',c1members);
        expect(c1members['uuid_3'][0]).toBe(members[0]);

        await Test.leaveNoChannel();

        const c2members = await redisManager.getSidsByUidArr(['uuid_10', 'uuid_3', 'uuid_0']);
        console.info('test.getSidsByUidArr c2members',c2members);
        expect(!!c2members['uuid_3'][0]).toBeFalsy();
        expect(c2members['uuid_0'][0]).toBe(c1members['uuid_0'][0]);

    });

    test('getMembersBySid',async ()=>{
        const index = Test.random(0, serverId.length - 1);
        const members = await redisManager.getMembersBySid(channelName[0], serverId[index]);
        console.info('getMembersBySid',members);
    });

    test('getMembersByChannelNameAndSid',async ()=>{
        const members = await redisManager.getMembersByChannelNameAndSid('connector_1', channelName[0]);
        console.info('test.getMembersByChannelNameAndSid',members);
        const c2members = await redisManager.getMembersByChannelNameAndSid('connector_1', channelName);
        console.info('test.getMembersByChannelNameAndSid c2members',c2members);
        expect(c2members[channelName[0]]).toMatchObject(members[channelName[0]]);
    });

    test('getMembersByChannel and leave uuid_1',async ()=>{
        const mock = jest.spyOn(app as any,'getServersByType').mockImplementation((val)=>val);
        const members = await redisManager.getMembersByChannelName(serverData as any, channelName);
        console.info('test.getMembersByChannel',members);
        const c1members = await redisManager.getMembersByChannelName(serverData as any, channelName[0]);
        console.info('test.getMembersByChannel c1members',c1members);
        expect(c1members[serverId[0]][channelName[0]]).toMatchObject(members[serverId[0]][channelName[0]]);

        const c2members = await redisManager.getMembersByChannelName(serverData as any, channelName[1]);
        expect(c2members[serverId[0]][channelName[1]]).toMatchObject(members[serverId[0]][channelName[1]]);

        await Test.leave();
        const c3members = await redisManager.getMembersByChannelName(serverData as any, channelName);
        console.info('test.getMembersByChannel c3members',c3members);
        expect(JSON.stringify(c3members).indexOf('"uuid_1"')==-1).toBeTruthy();
        expect(JSON.stringify(c3members).indexOf('"uuid_2"')==-1).toBeFalsy();
    });





});